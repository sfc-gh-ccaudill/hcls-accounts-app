"use client";

import { useEffect, useState } from "react";
import { Calendar, User, Building2, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { User as UserType } from "@/lib/types";

interface TeamActivity {
  USER_ID: number;
  USER_NAME: string;
  ACCOUNT_ID: number;
  ACCOUNT_NAME: string;
  ACTIVITY_TYPE: string;
  ACTIVITY_TITLE: string;
  ACTIVITY_DATE: string;
  ACTIVITY_DESCRIPTION: string | null;
}

interface GroupedActivities {
  [userName: string]: TeamActivity[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function TeamActivityPage() {
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activityRes, usersRes] = await Promise.all([
          fetch("/api/team-activity"),
          fetch("/api/users"),
        ]);
        const activityData = await activityRes.json();
        const usersData = await usersRes.json();
        setActivities(activityData);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedByUser: GroupedActivities = activities.reduce((acc, activity) => {
    if (!acc[activity.USER_NAME]) {
      acc[activity.USER_NAME] = [];
    }
    acc[activity.USER_NAME].push(activity);
    return acc;
  }, {} as GroupedActivities);

  const allUsers = users.map((u) => u.NAME);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekRange = `${weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-semibold">Team Activity</h1>
        <Badge variant="secondary" className="ml-2">
          {weekRange}
        </Badge>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allUsers.map((userName) => {
              const userActivities = groupedByUser[userName] || [];
              return (
                <Card key={userName} className="h-fit">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className={getAvatarColor(userName)}>
                        <AvatarFallback className="text-white bg-transparent">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{userName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {userActivities.length} activit{userActivities.length === 1 ? "y" : "ies"}{" "}
                          this week
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {userActivities.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No activity logged this week
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userActivities.map((activity, idx) => (
                          <div
                            key={idx}
                            className="border rounded-lg p-3 space-y-2 bg-muted/30"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-sm line-clamp-2">
                                {activity.ACTIVITY_TITLE}
                              </span>
                              <Badge variant="outline" className="shrink-0 text-xs">
                                {activity.ACTIVITY_TYPE}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {activity.ACCOUNT_NAME}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(activity.ACTIVITY_DATE)}
                              </span>
                            </div>
                            {activity.ACTIVITY_DESCRIPTION && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {activity.ACTIVITY_DESCRIPTION}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && activities.length === 0 && (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Team Activity This Week</h3>
              <p className="text-muted-foreground">
                Events and use case updates logged this week will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
