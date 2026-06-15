import { PackageCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { products } from "@/lib/products";
import { currency } from "@/lib/utils";

export function ProductGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {products.map((product) => (
        <Card key={product.id} id={product.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription className="mt-2">{product.description}</CardDescription>
              </div>
              <PackageCheck className="size-5 shrink-0 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Metric label="From" value={currency(product.priceFrom)} />
              <Metric label="MOQ" value={`${product.minQuantity}+`} />
              <Metric label="Lead time" value={`${product.leadTimeDays}d`} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
