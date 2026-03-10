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
  Sparkles,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Account, Event, UseCase, User, ActionItem } from "@/lib/types";

function NewActionItemButton({ onAdd, users, useCases }: { onAdd: (desc: string, due: string, owner: string, useCaseId: string) => void; users: User[]; useCases: UseCase[] }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState("");
  const [owner, setOwner] = useState("");
  const [useCaseId, setUseCaseId] = useState("");

  const handleAdd = () => {
    onAdd(desc, due, owner, useCaseId);
    setDesc("");
    setDue("");
    setOwner("");
    setUseCaseId("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-4 w-4 mr-1" />
        Add
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Action Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What needs to be done?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={owner} onValueChange={(v) => setOwner(v || "")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (<SelectItem key={u.ID} value={String(u.ID)}>{u.NAME}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Related Use Case</Label>
            <Select value={useCaseId} onValueChange={(v) => setUseCaseId(v || "")}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {useCases.map((uc) => (<SelectItem key={uc.ID} value={String(uc.ID)}>{uc.TITLE}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!desc.trim()} className="w-full">
            Add Action Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const EVENT_TYPES = ["Meeting", "Workshop", "Demo", "Call", "Training", "Review", "Conversation", "Document", "Other"];
const LOCATION_TYPES = ["Virtual", "On-site"];
const USE_CASE_STAGES = [
  "0 - Not in Pursuit",
  "1 - Discovery",
  "2 - Scoping",
  "3 - Technical/Business Validation",
  "4 - Use Case Won",
  "5 - Implementation In Progress",
  "6 - Implementation Complete",
  "7 - Deployed",
  "8 - Use Case Lost",
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
    case 1: return "bg-red-500";
    case 2: return "bg-orange-500";
    case 3: return "bg-yellow-500";
    case 4: return "bg-blue-500";
    case 5: return "bg-gray-500";
    default: return "bg-gray-300";
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [useCaseDialogOpen, setUseCaseDialogOpen] = useState(false);
  const [eventDetailDialog, setEventDetailDialog] = useState<(Event & { USER_NAME: string }) | null>(null);
  const [editingEvent, setEditingEvent] = useState<(Event & { USER_NAME: string }) | null>(null);
  const [editingUseCase, setEditingUseCase] = useState<(UseCase & { OWNER_NAME: string }) | null>(null);
  const [useCaseActivities, setUseCaseActivities] = useState<{ID: number; DESCRIPTION: string; CREATED_AT: string; USER_NAME: string}[]>([]);
  const [newActivity, setNewActivity] = useState("");
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [editingActivityText, setEditingActivityText] = useState("");

  const [newEvent, setNewEvent] = useState({
    title: "",
    event_type: "",
    location_type: "",
    event_date: "",
    event_time: "",
    attendees: "",
    objective: "",
    notes: "",
    use_case_id: "",
  });

  const [followUps, setFollowUps] = useState<{description: string; due_date: string; assigned_to: string; owner_id: string; use_case_id: string}[]>([]);
  const [editFollowUps, setEditFollowUps] = useState<{description: string; due_date: string; owner_id: string; use_case_id: string}[]>([]);

  const [newUseCase, setNewUseCase] = useState({
    title: "",
    use_case_id: "",
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
      const [accountRes, usersRes, actionItemsRes, currentUserRes] = await Promise.all([
        fetch(`/api/accounts/${id}`),
        fetch("/api/users"),
        fetch(`/api/action-items?account_id=${id}`),
        fetch("/api/current-user"),
      ]);
      const accountData = await accountRes.json();
      const usersData = await usersRes.json();
      const actionItemsData = await actionItemsRes.json();
      const currentUserData = await currentUserRes.json();

      setAccount(accountData.account);
      setEvents(accountData.events);
      setUseCases(accountData.useCases);
      setUsers(usersData);
      setActionItems(Array.isArray(actionItemsData) ? actionItemsData : []);
      if (currentUserData.user?.ID) {
        setCurrentUserId(currentUserData.user.ID);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSummary = async () => {
    try {
      const res = await fetch(`/api/ai-summary?account_id=${id}`);
      const data = await res.json();
      setAiSummary(data.summary || "");
    } catch {
      setAiSummary("Unable to load summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAiSummary();
  }, [id]);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.event_type || !newEvent.location_type || !newEvent.event_date) return;
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          account_id: id,
          user_id: currentUserId,
          use_case_id: newEvent.use_case_id || null,
          follow_ups: followUps.filter(f => f.description.trim()),
        }),
      });
      setNewEvent({
        title: "", event_type: "", location_type: "", event_date: "",
        event_time: "", attendees: "", objective: "", notes: "", use_case_id: "",
      });
      setFollowUps([]);
      setEventDialogOpen(false);
      fetchData();
      fetchAiSummary();
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    try {
      await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEvent.ID,
          use_case_id: editingEvent.USE_CASE_ID,
          title: editingEvent.TITLE,
          event_type: editingEvent.EVENT_TYPE,
          location_type: editingEvent.LOCATION_TYPE,
          event_date: editingEvent.EVENT_DATE,
          event_time: editingEvent.EVENT_TIME,
          attendees: editingEvent.ATTENDEES,
          objective: editingEvent.OBJECTIVE,
          notes: editingEvent.NOTES,
        }),
      });
      await handleSaveEditFollowUps(editingEvent.ID);
      setEditingEvent(null);
      fetchData();
    } catch (error) {
      console.error("Failed to update event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Delete this event and its follow-ups?")) return;
    try {
      await fetch(`/api/events?id=${eventId}`, { method: "DELETE" });
      setEventDetailDialog(null);
      fetchData();
      fetchAiSummary();
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleToggleActionItem = async (item: ActionItem) => {
    try {
      await fetch("/api/action-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.ID,
          completed: !item.COMPLETED,
          completed_by: "Current User",
        }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle action item:", error);
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
          estimated_value: newUseCase.estimated_value ? parseFloat(newUseCase.estimated_value) : null,
          owner_id: newUseCase.owner_id || null,
        }),
      });
      setNewUseCase({
        title: "", use_case_id: "", priority: "", estimated_value: "", stage: "",
        account_executive: "", solution_engineer: "", owner_id: "",
        description: "", salesforce_link: "",
      });
      setUseCaseDialogOpen(false);
      fetchData();
      fetchAiSummary();
    } catch (error) {
      console.error("Failed to create use case:", error);
    }
  };

  const handleUpdateUseCase = async () => {
    if (!editingUseCase) return;
    try {
      await fetch("/api/use-cases", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUseCase.ID,
          use_case_id: editingUseCase.USE_CASE_ID,
          title: editingUseCase.TITLE,
          priority: editingUseCase.PRIORITY,
          estimated_value: editingUseCase.ESTIMATED_VALUE,
          stage: editingUseCase.STAGE,
          account_executive: editingUseCase.ACCOUNT_EXECUTIVE,
          solution_engineer: editingUseCase.SOLUTION_ENGINEER,
          owner_id: editingUseCase.OWNER_ID,
          description: editingUseCase.DESCRIPTION,
          salesforce_link: editingUseCase.SALESFORCE_LINK,
        }),
      });
      setEditingUseCase(null);
      setUseCaseActivities([]);
      fetchData();
    } catch (error) {
      console.error("Failed to update use case:", error);
    }
  };

  const fetchUseCaseActivities = async (useCaseId: number) => {
    try {
      const res = await fetch(`/api/use-cases/${useCaseId}/activity`);
      const data = await res.json();
      setUseCaseActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch use case activities:", error);
      setUseCaseActivities([]);
    }
  };

  const handleAddActivity = async () => {
    if (!editingUseCase || !newActivity.trim()) return;
    try {
      await fetch(`/api/use-cases/${editingUseCase.ID}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          activity_type: "Salesforce Comment",
          description: newActivity,
        }),
      });
      setNewActivity("");
      fetchUseCaseActivities(editingUseCase.ID);
    } catch (error) {
      console.error("Failed to add activity:", error);
    }
  };

  const handleUpdateActivity = async () => {
    if (!editingUseCase || !editingActivityId || !editingActivityText.trim()) return;
    try {
      await fetch(`/api/use-cases/${editingUseCase.ID}/activity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_id: editingActivityId,
          description: editingActivityText,
        }),
      });
      setEditingActivityId(null);
      setEditingActivityText("");
      fetchUseCaseActivities(editingUseCase.ID);
    } catch (error) {
      console.error("Failed to update activity:", error);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!editingUseCase || !confirm("Delete this activity note?")) return;
    try {
      await fetch(`/api/use-cases/${editingUseCase.ID}/activity?activity_id=${activityId}`, {
        method: "DELETE",
      });
      fetchUseCaseActivities(editingUseCase.ID);
    } catch (error) {
      console.error("Failed to delete activity:", error);
    }
  };

  const openEditUseCase = (uc: UseCase & { OWNER_NAME: string }) => {
    setEditingUseCase(uc);
    fetchUseCaseActivities(uc.ID);
  };

  const handleDeleteUseCase = async (useCaseId: number) => {
    if (!confirm("Delete this use case and all its activity?")) return;
    try {
      await fetch(`/api/use-cases?id=${useCaseId}`, { method: "DELETE" });
      setEditingUseCase(null);
      fetchData();
      fetchAiSummary();
    } catch (error) {
      console.error("Failed to delete use case:", error);
    }
  };

  const addFollowUp = () => {
    setFollowUps([...followUps, { description: "", due_date: "", assigned_to: "", owner_id: "", use_case_id: "" }]);
  };

  const updateFollowUp = (index: number, field: string, value: string) => {
    const updated = [...followUps];
    updated[index] = { ...updated[index], [field]: value };
    setFollowUps(updated);
  };

  const removeFollowUp = (index: number) => {
    setFollowUps(followUps.filter((_, i) => i !== index));
  };

  const addEditFollowUp = () => {
    setEditFollowUps([...editFollowUps, { description: "", due_date: "", owner_id: "", use_case_id: "" }]);
  };

  const updateEditFollowUp = (index: number, field: string, value: string) => {
    const updated = [...editFollowUps];
    updated[index] = { ...updated[index], [field]: value };
    setEditFollowUps(updated);
  };

  const removeEditFollowUp = (index: number) => {
    setEditFollowUps(editFollowUps.filter((_, i) => i !== index));
  };

  const handleSaveEditFollowUps = async (eventId: number) => {
    for (const followUp of editFollowUps) {
      if (followUp.description?.trim()) {
        await fetch("/api/action-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_id: id,
            event_id: eventId,
            use_case_id: followUp.use_case_id || null,
            description: followUp.description,
            due_date: followUp.due_date || null,
            owner_id: followUp.owner_id || null,
          }),
        });
      }
    }
    setEditFollowUps([]);
  };

  const handleAddStandaloneActionItem = async (description: string, dueDate: string, ownerId: string, useCaseId: string) => {
    if (!description.trim()) return;
    await fetch("/api/action-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account_id: id,
        event_id: null,
        use_case_id: useCaseId || null,
        description,
        due_date: dueDate || null,
        owner_id: ownerId || null,
      }),
    });
    fetchData();
  };

  const totalValue = useCases?.reduce((sum, uc) => sum + (uc.ESTIMATED_VALUE || 0), 0) || 0;

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
        <Link href="/"><Button variant="link">Go back home</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{account.NAME}</h1>
        {account.ACCOUNT_TYPE && (
          <div className="flex gap-1 ml-2">
            {account.ACCOUNT_TYPE.split(", ").map((type) => (
              <Badge key={type} variant="secondary" className="bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border-0 text-xs">{type}</Badge>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-white to-violet-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <p className="text-sm leading-relaxed">{aiSummary}</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Events</span>
                  <span className="font-semibold">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Use Cases</span>
                  <span className="font-semibold">{useCases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pipeline Value</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(totalValue)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/30">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  Action Items ({actionItems.length})
                </CardTitle>
                <NewActionItemButton onAdd={handleAddStandaloneActionItem} users={users} useCases={useCases} />
              </CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto">
                {actionItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No action items yet.</p>
                ) : (
                  <div className="space-y-2">
                    {actionItems.map((item) => (
                      <div key={item.ID} className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50 transition-colors">
                        <button
                          onClick={() => handleToggleActionItem(item)}
                          className={item.COMPLETED ? "text-emerald-500" : "text-amber-500 hover:text-emerald-500 transition-colors"}
                        >
                          {item.COMPLETED ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${item.COMPLETED ? "line-through text-muted-foreground" : ""}`}>{item.DESCRIPTION}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {item.DUE_DATE && <span>Due: {formatDate(item.DUE_DATE)}</span>}
                            {item.OWNER_NAME && <span>Owner: {item.OWNER_NAME}</span>}
                            {item.EVENT_ID && <span className="text-violet-500">From event</span>}
                            {item.USE_CASE_TITLE && <span className="text-emerald-500">{item.USE_CASE_TITLE}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {account.DESCRIPTION && (
          <p className="text-muted-foreground">{account.DESCRIPTION}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-500" />
                Events ({events.length})
              </CardTitle>
              <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                <DialogTrigger render={<Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700" />}>
                  <Plus className="h-4 w-4 mr-1" />
                  Log Event
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Log New Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-title">Title *</Label>
                      <Input id="event-title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="e.g., Quarterly Business Review" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Event Type *</Label>
                        <Select value={newEvent.event_type} onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v as string })}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPES.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Location *</Label>
                        <Select value={newEvent.location_type} onValueChange={(v) => setNewEvent({ ...newEvent, location_type: v as string })}>
                          <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                          <SelectContent>
                            {LOCATION_TYPES.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event-date">Date *</Label>
                        <Input id="event-date" type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-time">Time</Label>
                        <Input id="event-time" type="time" value={newEvent.event_time} onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Related Use Case</Label>
                        <Select value={newEvent.use_case_id} onValueChange={(v) => setNewEvent({ ...newEvent, use_case_id: v as string })}>
                          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {useCases.map((uc) => (<SelectItem key={uc.ID} value={String(uc.ID)}>{uc.TITLE}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendees">Attendees</Label>
                      <Input id="attendees" value={newEvent.attendees} onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })} placeholder="e.g., John Smith, Jane Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="objective">Objective / Notes</Label>
                      <Textarea id="objective" value={newEvent.objective} onChange={(e) => setNewEvent({ ...newEvent, objective: e.target.value })} placeholder="What was discussed or accomplished?" />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">Follow-up Action Items</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addFollowUp}>
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </div>
                        {followUps.map((followUp, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2 space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-xs">Action Item {index + 1}</Label>
                            <button onClick={() => removeFollowUp(index)} className="text-gray-400 hover:text-red-500">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <Input placeholder="Description" value={followUp.description} onChange={(e) => updateFollowUp(index, "description", e.target.value)} />
                          <div className="grid grid-cols-3 gap-2">
                            <Input type="date" placeholder="Due date" value={followUp.due_date} onChange={(e) => updateFollowUp(index, "due_date", e.target.value)} />
                            <Select value={followUp.owner_id} onValueChange={(v) => updateFollowUp(index, "owner_id", v || "")}>
                              <SelectTrigger><SelectValue placeholder="Owner" /></SelectTrigger>
                              <SelectContent>
                                {users.map((user) => (<SelectItem key={user.ID} value={String(user.ID)}>{user.NAME}</SelectItem>))}
                              </SelectContent>
                            </Select>
                            <Select value={followUp.use_case_id} onValueChange={(v) => updateFollowUp(index, "use_case_id", v || "")}>
                              <SelectTrigger><SelectValue placeholder="Use Case" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {useCases.map((uc) => (<SelectItem key={uc.ID} value={String(uc.ID)}>{uc.TITLE}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button onClick={handleCreateEvent} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                      Log Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No events logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div
                      key={event.ID}
                      onClick={() => setEventDetailDialog(event)}
                      className="p-3 rounded-lg border hover:bg-violet-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{event.TITLE}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.EVENT_DATE)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.LOCATION_TYPE}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">{event.EVENT_TYPE}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Use Cases ({useCases.length})
              </CardTitle>
              <Dialog open={useCaseDialogOpen} onOpenChange={setUseCaseDialogOpen}>
                <DialogTrigger render={<Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" />}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Use Case
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Use Case</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="uc-title">Title *</Label>
                      <Input id="uc-title" value={newUseCase.title} onChange={(e) => setNewUseCase({ ...newUseCase, title: e.target.value })} placeholder="e.g., Data Lakehouse Migration" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uc-sfid">Salesforce Use Case ID</Label>
                      <Input id="uc-sfid" value={newUseCase.use_case_id} onChange={(e) => setNewUseCase({ ...newUseCase, use_case_id: e.target.value })} placeholder="e.g., UC-00123456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority (1-5)</Label>
                        <Select value={newUseCase.priority} onValueChange={(v) => setNewUseCase({ ...newUseCase, priority: v as string })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((p) => (<SelectItem key={p} value={String(p)}>{p} - {p === 1 ? "Highest" : p === 5 ? "Lowest" : ""}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uc-value">Estimated Value ($)</Label>
                        <Input id="uc-value" type="number" value={newUseCase.estimated_value} onChange={(e) => setNewUseCase({ ...newUseCase, estimated_value: e.target.value })} placeholder="e.g., 500000" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Stage</Label>
                      <Select value={newUseCase.stage} onValueChange={(v) => setNewUseCase({ ...newUseCase, stage: v as string })}>
                        <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                        <SelectContent>
                          {USE_CASE_STAGES.map((stage) => (<SelectItem key={stage} value={stage}>{stage}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ae">Account Executive</Label>
                        <Input id="ae" value={newUseCase.account_executive} onChange={(e) => setNewUseCase({ ...newUseCase, account_executive: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="se">Solution Engineer</Label>
                        <Input id="se" value={newUseCase.solution_engineer} onChange={(e) => setNewUseCase({ ...newUseCase, solution_engineer: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Owner</Label>
                      <Select value={newUseCase.owner_id} onValueChange={(v) => setNewUseCase({ ...newUseCase, owner_id: v as string })}>
                        <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (<SelectItem key={user.ID} value={String(user.ID)}>{user.NAME}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uc-desc">Description</Label>
                      <Textarea id="uc-desc" value={newUseCase.description} onChange={(e) => setNewUseCase({ ...newUseCase, description: e.target.value })} placeholder="Describe the use case..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sf-link">Salesforce Link</Label>
                      <Input id="sf-link" value={newUseCase.salesforce_link} onChange={(e) => setNewUseCase({ ...newUseCase, salesforce_link: e.target.value })} placeholder="https://..." />
                    </div>
                    <Button onClick={handleCreateUseCase} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
                      Add Use Case
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {useCases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No use cases yet.</p>
              ) : (
                <div className="space-y-2">
                  {useCases.map((uc) => (
                    <div 
                      key={uc.ID} 
                      onClick={() => openEditUseCase(uc)}
                      className="p-3 rounded-lg border hover:bg-emerald-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(uc.PRIORITY)}`} />
                          <div>
                            <h3 className="font-medium">{uc.TITLE}</h3>
                            {uc.USE_CASE_ID && (
                              <span className="text-xs text-muted-foreground">{uc.USE_CASE_ID}</span>
                            )}
                          </div>
                        </div>
                        {uc.SALESFORCE_LINK && (
                          <a 
                            href={uc.SALESFORCE_LINK} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        {uc.STAGE && <Badge variant="outline" className="text-xs">{uc.STAGE}</Badge>}
                        {uc.ESTIMATED_VALUE && (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
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
                      </div>
                      {uc.DESCRIPTION && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{uc.DESCRIPTION}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!eventDetailDialog} onOpenChange={() => setEventDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              {eventDetailDialog?.TITLE}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditingEvent(eventDetailDialog); setEventDetailDialog(null); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => eventDetailDialog && handleDeleteEvent(eventDetailDialog.ID)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {eventDetailDialog && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap gap-2">
                <Badge>{eventDetailDialog.EVENT_TYPE}</Badge>
                <Badge variant="outline">{eventDetailDialog.LOCATION_TYPE}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(eventDetailDialog.EVENT_DATE)}</p>
                </div>
                {eventDetailDialog.EVENT_TIME && (
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium">{eventDetailDialog.EVENT_TIME}</p>
                  </div>
                )}
              </div>
              {eventDetailDialog.USER_NAME && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Logged By</p>
                  <p className="font-medium">{eventDetailDialog.USER_NAME}</p>
                </div>
              )}
              {eventDetailDialog.USE_CASE_ID && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Related Use Case</p>
                  <p className="font-medium">{useCases.find(uc => uc.ID === eventDetailDialog.USE_CASE_ID)?.TITLE || "Unknown"}</p>
                </div>
              )}
              {eventDetailDialog.ATTENDEES && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Attendees</p>
                  <p>{eventDetailDialog.ATTENDEES}</p>
                </div>
              )}
              {eventDetailDialog.OBJECTIVE && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Objective / Notes</p>
                  <p>{eventDetailDialog.OBJECTIVE}</p>
                </div>
              )}
              {eventDetailDialog.NOTES && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Additional Notes</p>
                  <p>{eventDetailDialog.NOTES}</p>
                </div>
              )}
              {actionItems.filter(a => a.EVENT_ID === eventDetailDialog.ID).length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Follow-up Items</p>
                  <div className="space-y-2">
                    {actionItems.filter(a => a.EVENT_ID === eventDetailDialog.ID).map((item) => (
                      <div key={item.ID} className="flex items-center gap-2 text-sm">
                        <button onClick={() => handleToggleActionItem(item)} className={item.COMPLETED ? "text-emerald-500" : "text-gray-400"}>
                          {item.COMPLETED ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                        </button>
                        <span className={item.COMPLETED ? "line-through text-muted-foreground" : ""}>{item.DESCRIPTION}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={editingEvent.TITLE} onChange={(e) => setEditingEvent({ ...editingEvent, TITLE: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type *</Label>
                  <Select value={editingEvent.EVENT_TYPE} onValueChange={(v) => setEditingEvent({ ...editingEvent, EVENT_TYPE: v as string })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Select value={editingEvent.LOCATION_TYPE} onValueChange={(v) => setEditingEvent({ ...editingEvent, LOCATION_TYPE: v as string })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={editingEvent.EVENT_DATE?.split('T')[0]} onChange={(e) => setEditingEvent({ ...editingEvent, EVENT_DATE: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={editingEvent.EVENT_TIME || ""} onChange={(e) => setEditingEvent({ ...editingEvent, EVENT_TIME: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Attendees</Label>
                <Input value={editingEvent.ATTENDEES || ""} onChange={(e) => setEditingEvent({ ...editingEvent, ATTENDEES: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Related Use Case</Label>
                <Select 
                  value={editingEvent.USE_CASE_ID ? String(editingEvent.USE_CASE_ID) : ""} 
                  onValueChange={(v) => setEditingEvent({ ...editingEvent, USE_CASE_ID: v ? parseInt(v) : null })}
                >
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {useCases.map((uc) => (<SelectItem key={uc.ID} value={String(uc.ID)}>{uc.TITLE}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objective / Notes</Label>
                <Textarea value={editingEvent.OBJECTIVE || ""} onChange={(e) => setEditingEvent({ ...editingEvent, OBJECTIVE: e.target.value })} />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Existing Follow-ups</Label>
                </div>
                {actionItems.filter(a => a.EVENT_ID === editingEvent.ID).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No follow-ups for this event.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {actionItems.filter(a => a.EVENT_ID === editingEvent.ID).map((item) => (
                      <div key={item.ID} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                        <button onClick={() => handleToggleActionItem(item)} className={item.COMPLETED ? "text-emerald-500" : "text-gray-400"}>
                          {item.COMPLETED ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                        </button>
                        <span className={item.COMPLETED ? "line-through text-muted-foreground flex-1" : "flex-1"}>{item.DESCRIPTION}</span>
                        {item.DUE_DATE && <span className="text-xs text-muted-foreground">{formatDate(item.DUE_DATE)}</span>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Add New Follow-ups</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEditFollowUp}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {editFollowUps.map((followUp, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2 space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">New Action Item {index + 1}</Label>
                      <button onClick={() => removeEditFollowUp(index)} className="text-gray-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <Input placeholder="Description" value={followUp.description} onChange={(e) => updateEditFollowUp(index, "description", e.target.value)} />
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="date" placeholder="Due date" value={followUp.due_date} onChange={(e) => updateEditFollowUp(index, "due_date", e.target.value)} />
                      <Select value={followUp.owner_id} onValueChange={(v) => updateEditFollowUp(index, "owner_id", v || "")}>
                        <SelectTrigger><SelectValue placeholder="Owner" /></SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (<SelectItem key={user.ID} value={String(user.ID)}>{user.NAME}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Select value={followUp.use_case_id} onValueChange={(v) => updateEditFollowUp(index, "use_case_id", v || "")}>
                        <SelectTrigger><SelectValue placeholder="Use Case" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {useCases.map((uc) => (<SelectItem key={uc.ID} value={String(uc.ID)}>{uc.TITLE}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleUpdateEvent} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUseCase} onOpenChange={() => setEditingUseCase(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              Edit Use Case
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700" 
                onClick={() => editingUseCase && handleDeleteUseCase(editingUseCase.ID)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {editingUseCase && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input 
                  value={editingUseCase.TITLE} 
                  onChange={(e) => setEditingUseCase({ ...editingUseCase, TITLE: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Salesforce Use Case ID</Label>
                <Input 
                  value={editingUseCase.USE_CASE_ID || ""} 
                  onChange={(e) => setEditingUseCase({ ...editingUseCase, USE_CASE_ID: e.target.value })} 
                  placeholder="e.g., UC-00123456"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority (1-5)</Label>
                  <Select 
                    value={editingUseCase.PRIORITY ? String(editingUseCase.PRIORITY) : ""} 
                    onValueChange={(v) => setEditingUseCase({ ...editingUseCase, PRIORITY: v ? parseInt(v) : null })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((p) => (
                        <SelectItem key={p} value={String(p)}>{p} - {p === 1 ? "Highest" : p === 5 ? "Lowest" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Value ($)</Label>
                  <Input 
                    type="number" 
                    value={editingUseCase.ESTIMATED_VALUE || ""} 
                    onChange={(e) => setEditingUseCase({ ...editingUseCase, ESTIMATED_VALUE: e.target.value ? parseFloat(e.target.value) : null })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select 
                  value={editingUseCase.STAGE || ""} 
                  onValueChange={(v) => setEditingUseCase({ ...editingUseCase, STAGE: v || null })}
                >
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {USE_CASE_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Executive</Label>
                  <Input 
                    value={editingUseCase.ACCOUNT_EXECUTIVE || ""} 
                    onChange={(e) => setEditingUseCase({ ...editingUseCase, ACCOUNT_EXECUTIVE: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solution Engineer</Label>
                  <Input 
                    value={editingUseCase.SOLUTION_ENGINEER || ""} 
                    onChange={(e) => setEditingUseCase({ ...editingUseCase, SOLUTION_ENGINEER: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select 
                  value={editingUseCase.OWNER_ID ? String(editingUseCase.OWNER_ID) : ""} 
                  onValueChange={(v) => setEditingUseCase({ ...editingUseCase, OWNER_ID: v ? parseInt(v) : null })}
                >
                  <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.ID} value={String(user.ID)}>{user.NAME}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={editingUseCase.DESCRIPTION || ""} 
                  onChange={(e) => setEditingUseCase({ ...editingUseCase, DESCRIPTION: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Salesforce Link</Label>
                <Input 
                  value={editingUseCase.SALESFORCE_LINK || ""} 
                  onChange={(e) => setEditingUseCase({ ...editingUseCase, SALESFORCE_LINK: e.target.value })} 
                  placeholder="https://..." 
                />
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold">Use Case Activity</Label>
                <p className="text-xs text-muted-foreground mb-3">Capture Salesforce comments or other updates</p>
                <div className="flex gap-2 mb-4">
                  <Textarea 
                    value={newActivity} 
                    onChange={(e) => setNewActivity(e.target.value)} 
                    placeholder="Paste Salesforce comment or add a note..."
                    className="flex-1"
                    rows={2}
                  />
                  <Button type="button" onClick={handleAddActivity} disabled={!newActivity.trim()} className="self-end">
                    Add
                  </Button>
                </div>
                {useCaseActivities.length > 0 && (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {useCaseActivities.map((activity) => (
                      <div key={activity.ID} className="p-2 bg-gray-50 rounded text-sm">
                        {editingActivityId === activity.ID ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingActivityText}
                              onChange={(e) => setEditingActivityText(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateActivity}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => { setEditingActivityId(null); setEditingActivityText(""); }}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-2">
                              <p className="flex-1">{activity.DESCRIPTION}</p>
                              <div className="flex gap-1 shrink-0">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingActivityId(activity.ID); setEditingActivityText(activity.DESCRIPTION); }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600 hover:text-red-700" onClick={() => handleDeleteActivity(activity.ID)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.USER_NAME && `${activity.USER_NAME} • `}
                              {formatDate(activity.CREATED_AT)}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleUpdateUseCase} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
