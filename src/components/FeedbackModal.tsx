import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

const FEEDBACK_DISMISSED_KEY = "dasho-feedback-dismissed";
const FEEDBACK_DELAY_DAYS = 7;

const FeedbackModal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    const dismissed = localStorage.getItem(FEEDBACK_DISMISSED_KEY);
    if (dismissed) return;

    // Check if user account is older than FEEDBACK_DELAY_DAYS
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= FEEDBACK_DELAY_DAYS) {
      // Small delay so it doesn't pop immediately on load
      const timer = setTimeout(() => setOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleDismiss = () => {
    localStorage.setItem(FEEDBACK_DISMISSED_KEY, Date.now().toString());
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("feedback" as any).insert({
        user_id: user.id,
        message: message.trim().slice(0, 2000),
        source: "modal",
      });
      if (error) throw error;
      toast({ title: "Thank you!", description: "Your feedback has been submitted." });
      localStorage.setItem(FEEDBACK_DISMISSED_KEY, Date.now().toString());
      setOpen(false);
      setMessage("");
    } catch {
      toast({ title: "Failed to send feedback", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); else setOpen(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">How's your experience?</DialogTitle>
              <DialogDescription className="text-xs">
                We'd love to hear your thoughts on Dasho.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What do you like? What could be better? Any feature requests?"
            className="min-h-[120px] resize-none"
            maxLength={2000}
          />
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Maybe Later
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={sending || !message.trim()}
            >
              {sending ? "Sending…" : "Send Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
