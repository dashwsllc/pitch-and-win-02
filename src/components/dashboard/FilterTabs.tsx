import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FilterTabsProps {
  value: string
  onValueChange: (value: string) => void
}

export function FilterTabs({ value, onValueChange }: FilterTabsProps) {
  const filters = [
    { value: "hoje", label: "Hoje" },
    { value: "ontem", label: "Ontem" },
    { value: "7dias", label: "7 dias" },
    { value: "14dias", label: "14 dias" },
    { value: "30dias", label: "30 dias" },
    { value: "60dias", label: "60 dias" },
    { value: "90dias", label: "3 meses" },
  ]

  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="grid w-full grid-cols-7 bg-muted/50">
        {filters.map((filter) => (
          <TabsTrigger 
            key={filter.value}
            value={filter.value}
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            {filter.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}