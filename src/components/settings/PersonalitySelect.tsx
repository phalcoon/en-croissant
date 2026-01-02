import { piecePersonalityNameAtom, piecePersonalitiesConfigAtom } from "@/state/atoms";
import { loadPersonalityConfig } from "@/utils/piecePersonality";
import {
  Combobox,
  Group,
  Input,
  InputBase,
  ScrollArea,
  Text,
  useCombobox,
} from "@mantine/core";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

type Item = {
  label: string;
  value: string;
  description?: string;
};

type PersonalityManifest = {
  personalities: Array<{
    id: string;
    name: string;
    description: string;
  }>;
};

function SelectOption({ label, description }: { label: string; description?: string }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <div>
        <Text>{label}</Text>
        {description && (
          <Text size="xs" opacity={0.65}>
            {description}
          </Text>
        )}
      </div>
    </Group>
  );
}

export default function PersonalitySelect() {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [personality, setPersonality] = useAtom(piecePersonalityNameAtom);
  const setConfig = useSetAtom(piecePersonalitiesConfigAtom);
  const [loading, setLoading] = useState(false);
  const [availablePersonalities, setAvailablePersonalities] = useState<Item[]>([
    { label: "Standard", value: "standard", description: "Balanced and respectful" },
    { label: "Italian", value: "italian", description: "Passionate and expressive" },
  ]);

  // Load available personalities from manifest
  useEffect(() => {
    fetch("/personalities/manifest.json")
      .then((res) => res.json())
      .then((manifest: PersonalityManifest) => {
        const items = manifest.personalities.map((p) => ({
          label: p.name,
          value: p.id,
          description: p.description,
        }));
        setAvailablePersonalities(items);
      })
      .catch((err) => {
        console.warn("Failed to load personality manifest:", err);
      });
  }, []);

  const options = availablePersonalities.map((item) => (
    <Combobox.Option value={item.value} key={item.value}>
      <SelectOption label={item.label} description={item.description} />
    </Combobox.Option>
  ));

  const selected = availablePersonalities.find((p) => p.value === personality);

  useEffect(() => {
    // Load the personality configuration when changed
    if (personality) {
      setLoading(true);
      loadPersonalityConfig(personality)
        .then((config) => {
          if (config) {
            setConfig(config);
            console.log("Loaded personality:", config.name);
          }
        })
        .catch((err) => {
          console.error("Failed to load personality:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [personality, setConfig]);

  return (
    <Combobox
      store={combobox}
      withinPortal={true}
      onOptionSubmit={(val) => {
        setPersonality(val);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          onClick={() => combobox.toggleDropdown()}
          multiline
          w="12rem"
          disabled={loading}
        >
          {selected ? (
            <SelectOption label={selected.label} description={selected.description} />
          ) : (
            <Input.Placeholder>Pick value</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize type="scroll" mah={200}>
            {options}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
