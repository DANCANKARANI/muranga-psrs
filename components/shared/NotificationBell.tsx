"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async (silent = false) => {
    if (notifications.length === 0) setIsLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load notifications.");
      const data = (await response.json()) as NotificationsResponse;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      if (!silent) toast.error("Notifications could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [notifications.length]);

  const markRead = useCallback(async (id?: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : {}),
      });
      if (!response.ok) throw new Error("Unable to update notifications.");
      if (id) {
        setNotifications((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
        setUnreadCount((current) => Math.max(0, current - 1));
      } else {
        setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
      }
      return true;
    } catch {
      toast.error("Notifications could not be updated.");
      return false;
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadNotifications(true), 0);
    const interval = window.setInterval(() => void loadNotifications(true), 30_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  async function openNotification(event: MouseEvent, notification: NotificationItem) {
    if (notification.isRead || !notification.link) return;
    event.preventDefault();
    if (await markRead(notification.id)) router.push(notification.link);
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) void loadNotifications();
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
            className="relative text-slate-700"
            size="icon"
            variant="ghost"
          />
        }
      >
        <Bell aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 size-2.5 rounded-full bg-red-600 ring-2 ring-white" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between gap-3 px-2 py-2">
            <span>Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
              {isLoading && <LoaderCircle aria-label="Refreshing notifications" className="size-3.5 animate-spin text-slate-400" />}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading && notifications.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">You have no notifications.</p>
          ) : (
            notifications.map((notification) => {
              const content = (
                <div className="min-w-0 whitespace-normal py-1">
                  <div className="flex items-center gap-2">
                    {!notification.isRead && <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-blue-700" />}
                    <p className="truncate font-medium">{notification.title}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{notification.message}</p>
                  <time className="mt-1 block text-[11px] text-slate-500" dateTime={notification.createdAt}>
                    {formatDate(new Date(notification.createdAt))}
                  </time>
                </div>
              );

              return notification.link ? (
                <DropdownMenuItem
                  className="block cursor-pointer px-2 py-2"
                  key={notification.id}
                  nativeButton={false}
                  onClick={(event) => void openNotification(event, notification)}
                  render={<Link href={notification.link} />}
                >
                  {content}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="block px-2 py-2" key={notification.id}>
                  {content}
                </DropdownMenuItem>
              );
            })
          )}
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center gap-2 text-xs text-slate-600" disabled={unreadCount === 0} onClick={() => void markRead()}>
                <CheckCheck aria-hidden="true" />
                Mark all as read
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
