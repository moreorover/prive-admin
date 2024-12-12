"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";

type Props = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function Modal({ title, description, children }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const router = useRouter();

  const handleOpenChange = () => {
    router.back();
  };

  if (isDesktop) {
    return (
      <Dialog open={true} onOpenChange={handleOpenChange}>
        <DialogOverlay>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {children}
          </DialogContent>
        </DialogOverlay>
      </Dialog>
    );
  }

  return (
    <Drawer open={true} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
