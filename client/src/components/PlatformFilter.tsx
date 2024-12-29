import { Button } from "@/components/ui/button";
import { 
  SiX,
  SiReddit,
  SiLinkedin,
  SiInstagram 
} from "react-icons/si";

interface Props {
  selected: string | null;
  onSelect: (platform: string | null) => void;
}

const platforms = [
  { id: "twitter", name: "Twitter", icon: SiX },
  { id: "reddit", name: "Reddit", icon: SiReddit },
  { id: "linkedin", name: "LinkedIn", icon: SiLinkedin },
  { id: "instagram", name: "Instagram", icon: SiInstagram },
];

export default function PlatformFilter({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Button
        variant={selected === null ? "default" : "outline"}
        onClick={() => onSelect(null)}
      >
        All
      </Button>

      {platforms.map(({ id, name, icon: Icon }) => (
        <Button
          key={id}
          variant={selected === id ? "default" : "outline"}
          onClick={() => onSelect(id)}
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          {name}
        </Button>
      ))}
    </div>
  );
}