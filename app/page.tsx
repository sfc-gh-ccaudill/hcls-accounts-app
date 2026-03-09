"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Calendar, DollarSign, Briefcase, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AccountSummary, ACCOUNT_TYPES } from "@/lib/types";

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No meetings yet";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function HomePage() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: "", description: "", accountTypes: [] as string[] });

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccounts(data);
      } else {
        console.error("API returned non-array:", data);
        setAccounts([]);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async () => {
    if (!newAccount.name.trim()) return;
    try {
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccount.name,
          description: newAccount.description,
          account_type: newAccount.accountTypes.join(", "),
        }),
      });
      setNewAccount({ name: "", description: "", accountTypes: [] });
      setDialogOpen(false);
      fetchAccounts();
    } catch (error) {
      console.error("Failed to create account:", error);
    }
  };

  const totalValue = accounts.reduce((sum, a) => sum + (a.TOTAL_VALUE || 0), 0);
  const totalUseCases = accounts.reduce((sum, a) => sum + a.USE_CASE_COUNT, 0);

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Customer Accounts</h1>
        <div className="ml-auto">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25" />}>
              <Plus className="h-4 w-4 mr-1" />
              Add Account
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="e.g., Pfizer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {ACCOUNT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setNewAccount(prev => ({
                            ...prev,
                            accountTypes: prev.accountTypes.includes(type)
                              ? prev.accountTypes.filter(t => t !== type)
                              : [...prev.accountTypes, type]
                          }));
                        }}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                          newAccount.accountTypes.includes(type)
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-violet-400"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAccount.description}
                    onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                    placeholder="Brief description of the account"
                  />
                </div>
                <Button onClick={handleCreateAccount} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  Create Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg shadow-violet-500/5 bg-gradient-to-br from-white to-violet-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{loading ? "-" : accounts.length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg shadow-cyan-500/5 bg-gradient-to-br from-white to-cyan-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Use Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">{loading ? "-" : totalUseCases}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-white to-emerald-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{loading ? "-" : formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Link key={account.ID} href={`/accounts/${account.ID}`}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-white hover:scale-[1.02]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-violet-600" />
                        {account.NAME}
                      </CardTitle>
                      {account.ACCOUNT_TYPE && (
                        <div className="flex flex-wrap gap-1">
                          {account.ACCOUNT_TYPE.split(", ").map((type) => (
                            <Badge key={type} variant="secondary" className="bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border-0 text-xs">{type}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {account.DESCRIPTION && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {account.DESCRIPTION}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last Meeting
                        </span>
                        <span className="font-medium">
                          {formatDate(account.LAST_EVENT_DATE)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          Use Cases
                        </span>
                        <span className="font-medium">{account.USE_CASE_COUNT}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Value
                        </span>
                        <span className="font-medium">
                          {formatCurrency(account.TOTAL_VALUE)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
