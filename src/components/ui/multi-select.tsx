"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full min-h-10 h-auto justify-between rounded-2xl border-orange-100 bg-white hover:bg-white px-3"
        >
          <div className="flex flex-wrap gap-1 py-1">
            {selected.length === 0 && (
              <span className="text-slate-400 font-medium">{placeholder}</span>
            )}
            {selected.map((value) => {
              const option = options.find((o) => o.value === value);
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className="rounded-lg bg-orange-50 text-[#FF4500] hover:bg-orange-100 border-none font-bold text-[10px] gap-1 px-2 py-1"
                >
                  {option?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(value);
                    }}
                  />
                </Badge>
              );
            })}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-2xl shadow-xl border-orange-50">
        <Command className="rounded-2xl">
          <CommandInput placeholder="Cari outlet..." className="font-medium" />
          <CommandList>
            <CommandEmpty className="p-4 text-xs font-bold text-slate-400 italic text-center">
              Data tidak ditemukan.
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      selected.includes(option.value)
                        ? selected.filter((s) => s !== option.value)
                        : [...selected, option.value],
                    );
                  }}
                  className="text-xs font-bold"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-[#FF4500]",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
