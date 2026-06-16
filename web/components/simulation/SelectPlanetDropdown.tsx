import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectPlanetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bodies: string[];
  onSelect: (value: string) => void;
}

export function SelectPlanet({ bodies, onSelect }: SelectPlanetProps) {
  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Select a planet or star" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Star</SelectLabel>
          <SelectItem value="Sun">Sun</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Planets</SelectLabel>
          {bodies
            .filter((name) => name !== "Sun")
            .map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
