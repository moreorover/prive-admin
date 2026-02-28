import { Popover as PopoverPrimitive } from "radix-ui";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type ComboboxContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string[];
  onValueChange: (value: string[]) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  pointerDownOnInputRef: React.RefObject<boolean>;
};

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

function useCombobox() {
  const ctx = React.useContext(ComboboxContext);
  if (!ctx) throw new Error("useCombobox must be used within Combobox");
  return ctx;
}

function Combobox({
  children,
  value = [],
  onValueChange,
  onInputValueChange,
}: {
  children: React.ReactNode;
  value?: string[];
  onValueChange?: (value: string[]) => void;
  onInputValueChange?: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, _setInputValue] = React.useState("");
  const pointerDownOnInputRef = React.useRef(false);

  const setInputValue = React.useCallback(
    (val: string) => {
      _setInputValue(val);
      onInputValueChange?.(val);
    },
    [onInputValueChange],
  );

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!newOpen && pointerDownOnInputRef.current) {
        pointerDownOnInputRef.current = false;
        return;
      }
      setOpen(newOpen);
    },
    [],
  );

  return (
    <ComboboxContext.Provider
      value={{
        open,
        setOpen,
        value,
        onValueChange: onValueChange ?? (() => {}),
        inputValue,
        setInputValue,
        pointerDownOnInputRef,
      }}
    >
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        {children}
      </PopoverPrimitive.Root>
    </ComboboxContext.Provider>
  );
}

function ComboboxInput({
  className,
  placeholder,
  ...props
}: React.ComponentProps<"input">) {
  const { inputValue, setInputValue, setOpen, pointerDownOnInputRef } = useCombobox();

  return (
    <PopoverPrimitive.Anchor asChild>
      <div
        data-slot="combobox-input"
        onPointerDown={() => {
          pointerDownOnInputRef.current = true;
          requestAnimationFrame(() => {
            pointerDownOnInputRef.current = false;
          });
        }}
        className={cn(
          "border-input dark:bg-input/30 flex h-8 w-full items-center rounded-lg border bg-transparent text-sm transition-colors focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-3",
          className,
        )}
      >
        <input
          className="flex-1 bg-transparent px-3 py-1 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          placeholder={placeholder}
          {...props}
        />
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            className="flex items-center justify-center px-2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            <ChevronDownIcon className="size-4" />
          </button>
        </PopoverPrimitive.Trigger>
      </div>
    </PopoverPrimitive.Anchor>
  );
}

function ComboboxContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="combobox-content"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-lg shadow-md ring-1 duration-100",
          className,
        )}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

function ComboboxList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-list"
      role="listbox"
      className={cn("max-h-72 overflow-y-auto overscroll-contain p-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ComboboxItem({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const { value: selectedValues, onValueChange, setOpen, setInputValue } = useCombobox();
  const isSelected = selectedValues.includes(value);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      onClick={() => {
        onValueChange([value]);
        setInputValue("");
        setOpen(false);
      }}
      {...props}
    >
      {children}
      {isSelected && (
        <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
          <CheckIcon className="size-4" />
        </span>
      )}
    </div>
  );
}

function ComboboxEmpty({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-empty"
      className={cn(
        "text-muted-foreground w-full justify-center py-2 text-center text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
};
