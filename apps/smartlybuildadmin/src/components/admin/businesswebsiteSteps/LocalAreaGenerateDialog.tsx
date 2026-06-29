import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LocalAreaGenerateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localAreaGenerateCount: string;
  setLocalAreaGenerateCount: (value: string) => void;
  handleConfirmGenerateLocalAreas: () => void;
};

export function LocalAreaGenerateDialog({
  open,
  onOpenChange,
  localAreaGenerateCount,
  setLocalAreaGenerateCount,
  handleConfirmGenerateLocalAreas,
}: LocalAreaGenerateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Local Areas</DialogTitle>
          <DialogDescription>
            How many local areas would you like to generate? (1-50)
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="local-area-count">Number of Local Areas</Label>
          <Input
            id="local-area-count"
            type="number"
            min="1"
            max="50"
            value={localAreaGenerateCount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 50)) {
                setLocalAreaGenerateCount(val);
              }
            }}
            placeholder="Enter number (1-50)"
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-2">
            AI will generate local area names based on the location
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmGenerateLocalAreas} className="bg-blue-600 hover:bg-blue-700">
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
