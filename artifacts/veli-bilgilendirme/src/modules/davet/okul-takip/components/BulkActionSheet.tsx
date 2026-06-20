import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type BulkAction = {
  label: string;
  description?: string;
  onSelect: () => void;
  variant?: "default" | "destructive";
};

type Props = {
  actions: BulkAction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BulkActionSheet({ actions, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Toplu İşlem</SheetTitle>
          <SheetDescription>Seçili kapsamdaki tüm öğrencilere uygulanır.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              className="h-auto justify-start py-3 text-left"
              onClick={() => {
                action.onSelect();
                onOpenChange(false);
              }}
            >
              <span>
                <span className="block font-semibold">{action.label}</span>
                {action.description ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {action.description}
                  </span>
                ) : null}
              </span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
