"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Plus,
  DollarSign,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Account, Event, UseCase, User } from "@/lib/types";

const EVENT_TYPES = ["Meeting", "Workshop", "Demo", "Call", "Training", "Review"];
const LOCATION_TYPES = ["Virtual", "On-site"];
const USE_CASE_STAGES = [
  "Discovery",
  "Qualification",
  "POC",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getPriorityColor(priority: number | null): string {
  switch (priority) {
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-yellow-500";
    case 4:
      return "bg-blue-500";
    case 5:
      return "bg-gray-500";
    default:
      return "bg-gray-300";
  }
}

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [account, setAccount] = useState<Account | null>(null);
  const [events, setEvents] = useState<(Event & { USER_NAME: string })[]>([]);
  const [useCases, setUseCases] = useState<(UseCase & { OWNER_NAME: string })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [useCaseDialogOpen, setUseCaseDialogOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    event_type: "",
    location_type: "",
    event_date: "",
    event_time: "",
    attendees: "",
    objective: "",
    notes: "",
    user_id: "",
  });

  const [newUseCase, setNewUseCase] = useState({
    title: "",
    priority: "",
    estimated_value: "",
    stage: "",
    account_executive: "",
    solution_engineer: "",
    owner_id: "",
    description: "",
    salesforce_link: "",
  });

  const fetchData = async () => {
    try {
      const [accountRes, usersRes] = await Promise.all([
        fetch(`/api/accounts/${id}`),
        fetch("/api/users"),
      ]);
      const accountData = await accountRes.json();
      const usersData = await usersRes.json();

      setAccount(accountData.account);
      setEvents(accountData.events);
      setUseCases(accountData.useCases);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.event_type || !newEvent.location_type || !newEvent.event_date)
      return;
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          account_id: id,
          user_id: newEvent.user_id || null,
        }),
      });
      setNewEvent({
        title: "",
        event_type: "",
        location_type: "",
        event_date: "",
        event_time: "",
        attendees: "",
        objective: "",
        notes: "",
        user_id: "",
      });
      setEventDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleCreateUseCase = async () => {
    if (!newUseCase.title) return;
    try {
      await fetch("/api/use-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUseCase,
          account_id: id,
          priority: newUseCase.priority ? parseInt(newUseCase.priority) : null,
          estimated_value: newUseCase.estimated_value
            ? parseFloat(newUseCase.estimated_value)
            : null,
          owner_id: newUseCase.owner_id || null,
        }),
      });
      setNewUseCase({
        title: "",
        priority: "",
        estimated_value: "",
        stage: "",
        account_executive: "",
        solution_engineer: "",
        owner_id: "",
        description: "",
        salesforce_link: "",
      });
      setUseCaseDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to create use case:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Skeleton className="h-6 w-48" />
        </header>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-muted-foreground">Account not found</p>
        <Link href="/">
          <Button variant="link">Go back home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="font-semibold">{account.NAME}</h1>
        <Badge variant="secondary" className="ml-2">
          {account.INDUSTRY}
        </Badge>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {account.DESCRIPTION && (
          <p className="text-muted-foreground mb-6">{account.DESCRIPTION}</p>
        )}

        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
            <TabsTrigger value="usecases">Use Cases ({useCases.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Events</h2>
              <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="h-4 w-4 mr-1" />
                  Log Event
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Log New Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="event-title">Title *</Label>
                      <Input
                        id="event-title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="e.g., Quarterly Business Review"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Event Type *</Label>
                        <Select
                          value={newEvent.event_type}
                          onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v as string })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Location *</Label>
                        <Select
                          value={newEvent.location_type}
                          onValueChange={(v) => setNewEvent({ ...newEvent, location_type: v as string })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCATION_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event-date">Date *</Label>
                        <Input
                          id="event-date"
                          type="date"
                          value={newEvent.event_date}
                          onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-time">Time</Label>
                        <Input
                          id="event-time"
                          type="time"
                          value={newEvent.event_time}
                          onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Logged By</Label>
                      <Select
                        value={newEvent.user_id}
                        onValueChange={(v) => setNewEvent({ ...newEvent, user_id: v as string })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.ID} value={String(user.ID)}>
                              {user.NAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendees">Attendees</Label>
                      <Input
                        id="attendees"
                        value={newEvent.attendees}
                        onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                        placeholder="e.g., John Smith, Jane Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="objective">Objective / Notes</Label>
                      <Textarea
                        id="objective"
                        value={newEvent.objective}
                        onChange={(e) => setNewEvent({ ...newEvent, objective: e.target.value })}
                        placeholder="What was discussed or accomplished?"
                      />
                    </div>
                    <Button onClick={handleCreateEvent} className="w-full">
                      Log Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {events.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No events logged yet. Click &quot;Log Event&quot; to add the first one.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.ID}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{event.TITLE}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.EVENT_DATE)}
                              {event.EVENT_TIME && ` at ${event.EVENT_TIME}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.LOCATION_TYPE}
                            </span>
                            {event.USER_NAME && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.USER_NAME}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge>{event.EVENT_TYPE}</Badge>
                      </div>
                      {event.ATTENDEES && (
                        <p className="text-sm mt-2">
                          <strong>Attendees:</strong> {event.ATTENDEES}
                        </p>
                      )}
                      {event.OBJECTIVE && (
                        <p className="text-sm text-muted-foreground mt-2">{event.OBJECTIVE}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="usecases" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Use Cases</h2>
              <Dialog open={useCaseDialogOpen} onOpenChange={setUseCaseDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Use Case
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Use Case</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="uc-title">Title *</Label>
                      <Input
                        id="uc-title"
                        value={newUseCase.title}
                        onChange={(e) =>
                          setNewUseCase({ ...newUseCase, title: e.target.value })
                        }
                        placeholder="e.g., Data Lakehouse Migration"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority (1-5)</Label>
                        <Select
                          value={newUseCase.priority}
                          onValueChange={(v) => setNewUseCase({ ...newUseCase, priority: v as string })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((p) => (
                              <SelectItem key={p} value={String(p)}>
                                {p} - {p === 1 ? "Highest" : p === 5 ? "Lowest" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uc-value">Estimated Value ($)</Label>
                        <Input
                          id="uc-value"
                          type="number"
                          value={newUseCase.estimated_value}
                          onChange={(e) =>
                            setNewUseCase({ ...newUseCase, estimated_value: e.target.value })
                          }
                          placeholder="e.g., 500000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Stage</Label>
                      <Select
                        value={newUseCase.stage}
                        onValueChange={(v) => setNewUseCase({ ...newUseCase, stage: v as string })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {USE_CASE_STAGES.map((stage) => (
                            <SelectItem key={stage} value={stage}>
                              {stage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ae">Account Executive</Label>
                        <Input
                          id="ae"
                          value={newUseCase.account_executive}
                          onChange={(e) =>
                            setNewUseCase({ ...newUseCase, account_executive: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="se">Solution Engineer</Label>
                        <Input
                          id="se"
                          value={newUseCase.solution_engineer}
                          onChange={(e) =>
                            setNewUseCase({ ...newUseCase, solution_engineer: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Owner</Label>
                      <Select
                        value={newUseCase.owner_id}
                        onValueChange={(v) => setNewUseCase({ ...newUseCase, owner_id: v as string })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.ID} value={String(user.ID)}>
                              {user.NAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uc-desc">Description</Label>
                      <Textarea
                        id="uc-desc"
                        value={newUseCase.description}
                        onChange={(e) =>
                          setNewUseCase({ ...newUseCase, description: e.target.value })
                        }
                        placeholder="Describe the use case..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sf-link">Salesforce Link</Label>
                      <Input
                        id="sf-link"
                        value={newUseCase.salesforce_link}
                        onChange={(e) =>
                          setNewUseCase({ ...newUseCase, salesforce_link: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <Button onClick={handleCreateUseCase} className="w-full">
                      Add Use Case
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {useCases.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No use cases yet. Click &quot;Add Use Case&quot; to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {useCases.map((uc) => (
                  <Card key={uc.ID}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getPriorityColor(uc.PRIORITY)}`}
                            />
                            <h3 className="font-medium">{uc.TITLE}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {uc.STAGE && <Badge variant="outline">{uc.STAGE}</Badge>}
                            {uc.ESTIMATED_VALUE && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(uc.ESTIMATED_VALUE)}
                              </span>
                            )}
                            {uc.OWNER_NAME && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {uc.OWNER_NAME}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Updated {formatDate(uc.UPDATED_AT)}
                            </span>
                          </div>
                        </div>
                        {uc.SALESFORCE_LINK && (
                          <a
                            href={uc.SALESFORCE_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      {uc.DESCRIPTION && (
                        <p className="text-sm text-muted-foreground mt-2">{uc.DESCRIPTION}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm">
                        {uc.ACCOUNT_EXECUTIVE && (
                          <span>
                            <strong>AE:</strong> {uc.ACCOUNT_EXECUTIVE}
                          </span>
                        )}
                        {uc.SOLUTION_ENGINEER && (
                          <span>
                            <strong>SE:</strong> {uc.SOLUTION_ENGINEER}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
