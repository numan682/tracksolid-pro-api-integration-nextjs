"use client";

import { useEffect } from "react";
import { Boxes, Loader2, RotateCcw, UserRoundCog } from "lucide-react";
import { useApiAction } from "@/hooks/use-api-action";
import { ResultView } from "@/components/result-view";
import { PageBody, Panel } from "@/components/workspace";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
  const accounts = useApiAction();
  const groups = useApiAction();

  useEffect(() => {
    accounts.run("jimi.user.child.list").catch(() => {});
    groups.run("jimi.device.group.list").catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageBody>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          icon={UserRoundCog}
          title="Sub-accounts"
          description="Accounts under your tenant"
          action={
            <Button size="sm" variant="outline" onClick={() => accounts.run("jimi.user.child.list").catch(() => {})} disabled={accounts.loading}>
              {accounts.loading ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className={cn("size-3.5")} />} Refresh
            </Button>
          }
        >
          <ResultView loading={accounts.loading} error={accounts.error} data={accounts.data} emptyHint="No sub-accounts found." />
        </Panel>

        <Panel
          icon={Boxes}
          title="Device groups"
          description="Logical groupings of devices"
          action={
            <Button size="sm" variant="outline" onClick={() => groups.run("jimi.device.group.list").catch(() => {})} disabled={groups.loading}>
              {groups.loading ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />} Refresh
            </Button>
          }
        >
          <ResultView loading={groups.loading} error={groups.error} data={groups.data} emptyHint="No device groups found." />
        </Panel>
      </div>
    </PageBody>
  );
}
