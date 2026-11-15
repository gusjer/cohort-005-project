// PROTOTYPE — throwaway. Not production code. Lives on branch `prototype/notification-inbox`.
//
// Three variants of where Notifications appear and how a person reads, dismisses
// and acts on them, mounted in the real app layout and switchable via `?variant=`.
//
//   A  Bell + popover     a bell in the sidebar header opens a short list
//   B  Inbox page         a "Notifications" nav item opens a full page
//   C  Badges, no inbox   counts sit on the nav items; a strip shows the newest
//
// Everything is fake and in memory: a pretend "server" list (what the provider
// holds) and a "shown" snapshot (what the last loader run returned). The bar at
// the bottom lets you make a Notification arrive, choose when the app re-reads,
// and take the provider down.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router";
import {
  Bell,
  BellOff,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Receipt,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";

// ─── Fake data ───────────────────────────────────────────────────────────────

type Kind =
  | "refund-raised"
  | "refund-approved"
  | "refund-declined"
  | "refund-to-decide"
  | "new-question"
  | "reply"
  | "seat-claimed";

interface Notification {
  id: number;
  kind: Kind;
  title: string;
  body: string;
  to: string; // where clicking takes you
  when: string;
  day: "Today" | "Earlier";
  read: boolean;
}

export interface ProtoProfile {
  role: "student" | "instructor" | "admin" | null;
  isTeamAdmin: boolean;
  lessonPath: string; // a real lesson, so thread links land somewhere true
}

let nextId = 100;
const n = (
  kind: Kind,
  title: string,
  body: string,
  to: string,
  when: string,
  day: Notification["day"],
  read = false
): Notification => ({ id: nextId++, kind, title, body, to, when, day, read });

function seed(p: ProtoProfile): Notification[] {
  const thread = p.lessonPath;
  if (p.role === "admin") {
    return [
      n("refund-to-decide", "Refund Request to decide", "Maya Chen asked for a refund on Intro to TypeScript ($49.00).", "/admin/refunds", "12 min ago", "Today"),
      n("refund-to-decide", "Refund Request to decide", "Acme Team (Team Licence, 3 of 10 Seats claimed) asked for a refund.", "/admin/refunds", "2 h ago", "Today"),
      n("reply", "New Reply on a thread you joined", "Sam Ortiz: “That fixed it, thanks — one follow-up though…”", thread, "Yesterday", "Earlier"),
      n("refund-raised", "We received your Refund Request", "Your request for Advanced React is waiting for a decision.", "/settings", "3 days ago", "Earlier", true),
    ];
  }
  if (p.role === "instructor") {
    return [
      n("new-question", "New Question on your course", "Maya Chen asked on “Generics in practice”: “Why does infer not work here?”", thread, "5 min ago", "Today"),
      n("new-question", "New Question on your course", "Sam Ortiz asked on “Narrowing”: “Is there a way to narrow by tuple length?”", "/instructor/questions", "1 h ago", "Today"),
      n("reply", "New Reply on a thread you joined", "Maya Chen: “Got it. Does that also apply to conditional types?”", thread, "3 h ago", "Today"),
      n("new-question", "New Question on your course", "Lee Park asked on “Setup”: “Which Node version should I use?”", "/instructor/questions", "2 days ago", "Earlier", true),
    ];
  }
  const student: Notification[] = [
    n("reply", "New Reply to your Question", "Your Instructor replied: “infer only works inside the extends clause…”", thread, "20 min ago", "Today"),
    n("refund-approved", "Your Refund Request was approved", "Intro to TypeScript — $49.00 will be refunded. Your Enrollment has ended.", "/settings", "4 h ago", "Today"),
    n("refund-raised", "We received your Refund Request", "Your request for Intro to TypeScript is waiting for a decision.", "/settings", "Yesterday", "Earlier", true),
    n("reply", "New Reply on a thread you joined", "Sam Ortiz: “Same problem here, this helped.”", thread, "4 days ago", "Earlier", true),
  ];
  if (!p.isTeamAdmin) return student;
  return [
    n("seat-claimed", "Seat claimed", "Jo Rivera claimed a Seat on Advanced React. 6 of 10 Seats left.", "/team", "8 min ago", "Today"),
    n("seat-claimed", "Seat claimed", "Ana Lima claimed a Seat on Advanced React. 7 of 10 Seats left.", "/team", "1 h ago", "Today"),
    n("refund-declined", "Your Refund Request was declined", "Team Licence for Node Fundamentals — outside the refund window.", "/settings", "Yesterday", "Earlier"),
    ...student,
  ];
}

const ARRIVALS: Record<string, [Kind, string, string, string][]> = {
  admin: [["refund-to-decide", "Refund Request to decide", "Lee Park asked for a refund on Node Fundamentals ($29.00).", "/admin/refunds"]],
  instructor: [["new-question", "New Question on your course", "Ana Lima asked: “Can you share the slides for this lesson?”", "/instructor/questions"]],
  student: [["reply", "New Reply to your Question", "Your Instructor replied: “Yes — see the next lesson.”", ""]],
  teamAdmin: [["seat-claimed", "Seat claimed", "Kim Novak claimed a Seat on Advanced React. 5 of 10 Seats left.", "/team"]],
};

const ICON: Record<Kind, React.ReactNode> = {
  "refund-raised": <Receipt className="size-4" />,
  "refund-approved": <Receipt className="size-4" />,
  "refund-declined": <Receipt className="size-4" />,
  "refund-to-decide": <Receipt className="size-4" />,
  "new-question": <MessageSquare className="size-4" />,
  reply: <MessageSquare className="size-4" />,
  "seat-claimed": <UsersRound className="size-4" />,
};

// ─── State ───────────────────────────────────────────────────────────────────

const VARIANTS = [
  { key: "A", name: "Bell + popover" },
  { key: "B", name: "Inbox page" },
  { key: "C", name: "Badges, no inbox" },
] as const;
type VariantKey = (typeof VARIANTS)[number]["key"];

type Refresh = "navigation" | "focus" | "poll";
const REFRESH_LABEL: Record<Refresh, string> = {
  navigation: "on navigation only",
  focus: "+ when the tab regains focus",
  poll: "+ focus + every 15 s",
};

interface Ctx {
  variant: VariantKey;
  setVariant: (v: VariantKey) => void;
  shown: Notification[];
  serverUnread: number;
  unread: number;
  unavailable: boolean;
  setDown: (d: boolean) => void;
  down: boolean;
  refresh: Refresh;
  setRefresh: (r: Refresh) => void;
  lastSync: string;
  arrive: () => void;
  markRead: (id: number, read?: boolean) => void;
  markAllRead: (filter?: (x: Notification) => boolean) => void;
  dismiss: (id: number) => void;
  reset: () => void;
}

const ProtoCtx = createContext<Ctx | null>(null);
const useProto = () => {
  const c = useContext(ProtoCtx);
  if (!c) throw new Error("ProtoNotificationsProvider missing");
  return c;
};

export function ProtoNotificationsProvider({
  profile,
  userId,
  children,
}: {
  profile: ProtoProfile;
  userId: number | null;
  children: React.ReactNode;
}) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const paramVariant = params.get("variant") as VariantKey | null;
  const [variant, setVariantState] = useState<VariantKey>(
    VARIANTS.some((v) => v.key === paramVariant) ? paramVariant! : "A"
  );
  const [server, setServer] = useState<Notification[]>(() => seed(profile));
  const [shown, setShown] = useState<Notification[]>(server);
  const [down, setDown] = useState(false);
  const [refresh, setRefresh] = useState<Refresh>("navigation");
  const [lastSync, setLastSync] = useState("page load");
  const serverRef = useRef(server);
  serverRef.current = server;

  const sync = (why: string) => {
    setShown(serverRef.current);
    setLastSync(why);
  };

  // Switching user in the DevUI = a different person's inbox.
  useEffect(() => {
    const fresh = seed(profile);
    setServer(fresh);
    setShown(fresh);
    setLastSync("page load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // The loader re-runs on every navigation.
  useEffect(() => {
    sync("navigation");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (refresh === "navigation") return;
    const onFocus = () => sync("tab focus");
    window.addEventListener("focus", onFocus);
    const timer =
      refresh === "poll" ? setInterval(() => sync("15 s poll"), 15000) : null;
    return () => {
      window.removeEventListener("focus", onFocus);
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const both = (f: (list: Notification[]) => Notification[]) => {
    setServer(f);
    setShown(f);
  };

  const value: Ctx = {
    variant,
    setVariant: (v) => {
      setVariantState(v);
      setParams(
        (prev) => {
          prev.set("variant", v);
          return prev;
        },
        { replace: true, preventScrollReset: true }
      );
    },
    shown: down ? [] : shown,
    unread: down ? 0 : shown.filter((x) => !x.read).length,
    serverUnread: server.filter((x) => !x.read).length,
    unavailable: down,
    down,
    setDown,
    refresh,
    setRefresh,
    lastSync,
    arrive: () => {
      const key =
        profile.role === "student" && profile.isTeamAdmin
          ? "teamAdmin"
          : profile.role ?? "student";
      const [kind, title, body, to] = ARRIVALS[key][0];
      setServer((list) => [
        n(kind, title, body, to || profile.lessonPath, "Just now", "Today"),
        ...list,
      ]);
    },
    markRead: (id, read = true) =>
      both((l) => l.map((x) => (x.id === id ? { ...x, read } : x))),
    markAllRead: (filter = () => true) =>
      both((l) => l.map((x) => (filter(x) ? { ...x, read: true } : x))),
    dismiss: (id) => both((l) => l.filter((x) => x.id !== id)),
    reset: () => {
      const fresh = seed(profile);
      setServer(fresh);
      setShown(fresh);
    },
  };

  return <ProtoCtx.Provider value={value}>{children}</ProtoCtx.Provider>;
}

function Badge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground",
        className
      )}
    >
      {count}
    </span>
  );
}

function Unavailable({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground",
        className
      )}
    >
      <BellOff className="size-6" />
      <div className="font-medium text-foreground">
        Notifications unavailable
      </div>
      <div>We couldn't load your Notifications right now. Try again later.</div>
    </div>
  );
}

// ─── Variant A: bell + popover ───────────────────────────────────────────────
// Entry: bell in the sidebar header. Clicking a row marks it read and goes there.
// No dismiss; "Mark all as read" clears the badge. Nothing else to manage.

export function ProtoSidebarHeaderSlot() {
  const p = useProto();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  if (p.variant !== "A") return null;

  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        title={p.unavailable ? "Notifications unavailable" : "Notifications"}
        className={cn(
          "relative rounded-md p-2 transition-colors hover:bg-sidebar-accent",
          p.unavailable && "text-sidebar-foreground/40"
        )}
      >
        {p.unavailable ? (
          <BellOff className="size-4" />
        ) : (
          <Bell className="size-4" />
        )}
        <Badge count={p.unread} className="absolute -right-1 -top-1" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-50 w-96 rounded-lg border bg-popover text-popover-foreground shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-sm font-semibold">Notifications</div>
              {p.unread > 0 && (
                <button
                  onClick={() => p.markAllRead()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            {p.unavailable ? (
              <Unavailable />
            ) : p.shown.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                You're all caught up.
              </div>
            ) : (
              <ul className="max-h-[28rem] divide-y overflow-y-auto">
                {p.shown.map((x) => (
                  <li key={x.id}>
                    <Link
                      to={x.to}
                      onClick={() => p.markRead(x.id)}
                      className="flex gap-3 px-4 py-3 hover:bg-accent"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          x.read ? "bg-transparent" : "bg-primary"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "text-sm",
                            x.read ? "text-muted-foreground" : "font-semibold"
                          )}
                        >
                          {x.title}
                        </div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {x.body}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground/70">
                          {x.when}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Variant B: inbox page ───────────────────────────────────────────────────
// Entry: a nav item with a count. A full page with Unread / All tabs, grouped by
// day. Each row can be opened, toggled read/unread, or dismissed for good.

export function ProtoNavSlot() {
  const p = useProto();
  if (p.variant !== "B") return null;
  return (
    <NavLink
      to="/prototype/notifications"
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )
      }
    >
      {p.unavailable ? (
        <BellOff className="size-4" />
      ) : (
        <Bell className="size-4" />
      )}
      Notifications
      <Badge count={p.unread} className="ml-auto" />
    </NavLink>
  );
}

export function ProtoInboxPage() {
  const p = useProto();
  const [tab, setTab] = useState<"unread" | "all">("unread");

  if (p.variant !== "B") {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        This page only exists in variant B (Inbox page). Variant {p.variant} has
        no Notifications page.
      </div>
    );
  }

  const list = tab === "unread" ? p.shown.filter((x) => !x.read) : p.shown;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {p.unavailable
              ? "—"
              : p.unread === 0
                ? "Nothing unread."
                : `${p.unread} unread`}
          </p>
        </div>
        {p.unread > 0 && (
          <button
            onClick={() => p.markAllRead()}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-1 border-b">
        {(["unread", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {p.unavailable ? (
        <Unavailable className="rounded-lg border" />
      ) : list.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
          {tab === "unread" ? "You're all caught up." : "No Notifications yet."}
        </div>
      ) : (
        (["Today", "Earlier"] as const).map((day) => {
          const rows = list.filter((x) => x.day === day);
          if (rows.length === 0) return null;
          return (
            <section key={day} className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {day}
              </h2>
              <ul className="divide-y rounded-lg border">
                {rows.map((x) => (
                  <li
                    key={x.id}
                    className={cn(
                      "group flex items-start gap-4 p-4",
                      !x.read && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 rounded-md p-2",
                        x.read
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      {ICON[x.kind]}
                    </span>
                    <Link
                      to={x.to}
                      onClick={() => p.markRead(x.id)}
                      className="min-w-0 flex-1"
                    >
                      <div
                        className={cn(
                          "text-sm hover:underline",
                          !x.read && "font-semibold"
                        )}
                      >
                        {x.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {x.body}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground/70">
                        {x.when}
                      </div>
                    </Link>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => p.markRead(x.id, !x.read)}
                        title={x.read ? "Mark as unread" : "Mark as read"}
                        className="rounded-md border p-1.5 hover:bg-accent"
                      >
                        {x.read ? (
                          <Bell className="size-3.5" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => p.dismiss(x.id)}
                        title="Dismiss"
                        className="rounded-md border p-1.5 hover:bg-accent"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

// ─── Variant C: badges, no inbox ─────────────────────────────────────────────
// No list anywhere. A count sits on the nav item where the work is (Refund
// Requests, Questions, Team, the Settings cog). Visiting that page marks them
// read. A strip above the page shows the newest unread one, with View / Dismiss
// — the only place a Reply on a thread can surface, since lessons have no nav item.

const sameTarget = (to: string, navTo: string) =>
  to === navTo || to.startsWith(navTo + "/");

export function ProtoNavBadge({ to }: { to: string }) {
  const p = useProto();
  const location = useLocation();
  const here = sameTarget(location.pathname, to);

  // "Seen is read": arriving on the destination clears its Notifications.
  useEffect(() => {
    if (p.variant === "C" && here) p.markAllRead((x) => x.to === to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.variant, here, to]);

  if (p.variant !== "C") return null;
  return (
    <Badge
      count={p.shown.filter((x) => !x.read && x.to === to).length}
      className="ml-auto"
    />
  );
}

export function ProtoMainTop() {
  const p = useProto();
  if (p.variant !== "C") return null;

  if (p.unavailable) {
    return (
      <div className="flex items-center gap-2 border-b bg-muted px-6 py-2 text-xs text-muted-foreground">
        <BellOff className="size-3.5" /> Notifications unavailable — counts in
        the sidebar may be missing.
      </div>
    );
  }

  const unread = p.shown.filter((x) => !x.read);
  const newest = unread[0];
  if (!newest) return null;

  return (
    <div className="flex items-center gap-3 border-b bg-primary/10 px-6 py-2.5 text-sm">
      <span className="text-primary">{ICON[newest.kind]}</span>
      <div className="min-w-0 flex-1 truncate">
        <span className="font-semibold">{newest.title}</span>
        <span className="text-muted-foreground"> — {newest.body}</span>
      </div>
      {unread.length > 1 && (
        <span className="shrink-0 text-xs text-muted-foreground">
          +{unread.length - 1} more
        </span>
      )}
      <Link
        to={newest.to}
        onClick={() => p.markRead(newest.id)}
        className="shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
      >
        View
      </Link>
      <button
        onClick={() => p.markRead(newest.id)}
        title="Dismiss"
        className="shrink-0 rounded-md p-1 hover:bg-primary/20"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// ─── Floating switcher + prototype controls ──────────────────────────────────

export function PrototypeSwitcher() {
  const p = useProto();
  const index = VARIANTS.findIndex((v) => v.key === p.variant);
  const current = VARIANTS[index];
  const cycle = useMemo(
    () => (step: number) =>
      p.setVariant(
        VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length].key
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft") cycle(-1);
      if (e.key === "ArrowRight") cycle(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle]);

  if (!import.meta.env.DEV) return null;

  const pending = p.serverUnread - p.unread;
  const btn =
    "rounded-full px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20";

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      <div className="flex items-center gap-2 rounded-full bg-zinc-900/95 px-3 py-1.5 text-[11px] text-zinc-300 shadow-xl">
        <button className={btn} onClick={p.arrive}>
          + Notification arrives
        </button>
        <label className="flex items-center gap-1">
          Re-read
          <select
            value={p.refresh}
            onChange={(e) => p.setRefresh(e.target.value as Refresh)}
            className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-100"
          >
            {Object.entries(REFRESH_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={p.down}
            onChange={(e) => p.setDown(e.target.checked)}
          />
          Provider down
        </label>
        <button className={btn} onClick={p.reset}>
          Reset
        </button>
        <span className="border-l border-white/20 pl-2 font-mono">
          provider {p.serverUnread} unread · shown{" "}
          {p.unavailable ? "—" : p.unread}
          {pending > 0 && !p.unavailable && (
            <span className="text-amber-400"> · {pending} not shown yet</span>
          )}{" "}
          · last read: {p.lastSync}
        </span>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1.5 text-sm text-white shadow-2xl ring-2 ring-fuchsia-500">
        <button
          onClick={() => cycle(-1)}
          className="rounded-full p-1 hover:bg-white/20"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-44 text-center font-medium">
          {current.key} ({current.name})
        </span>
        <button
          onClick={() => cycle(1)}
          className="rounded-full p-1 hover:bg-white/20"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
