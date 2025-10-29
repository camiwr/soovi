// import React, { useEffect, useMemo, useState } from "react";
// import { View, Text, TextInput, StyleSheet, Switch } from "react-native";
// import type { Area } from "@/types/area";

// type Values = {
//   area?: Area | null;
//   title: string;
//   description?: string;
//   lot_size_m2: number;
//   usable_ratio: number;
//   price_per_lot?: number;
//   price_per_m2?: number;
//   infra_cost_per_m2?: number;
//   variable_cost_per_m2?: number;
//   fixed_costs?: number;
//   commission_pct?: number;
//   tax_pct?: number;
// };

// export default function SimulationForm({
//   areas,
//   initial,
//   onChange,
// }: {
//   areas: Area[];
//   initial?: Partial<Values>;
//   onChange: (v: Values) => void;
// }) {
//   const [areaId, setAreaId] = useState(initial?.area?.id ?? areas[0]?.id ?? "");
//   const selectedArea = useMemo(() => areas.find(a => a.id === areaId) ?? null, [areas, areaId]);

//   const [title, setTitle] = useState(initial?.title ?? "");
//   const [description, setDescription] = useState(initial?.description ?? "");
//   const [pricingMode, setPricingMode] = useState<PricingMode>(initial?.pricing_mode ?? "PER_LOT");
//   const [lotSize, setLotSize] = useState(String(initial?.lot_size_m2 ?? ""));
//   const [usable, setUsable] = useState(String(initial?.usable_ratio ?? "0.6")); // 60% padrão

//   const [pricePerLot, setPricePerLot] = useState(String(initial?.price_per_lot ?? ""));
//   const [pricePerM2, setPricePerM2] = useState(String(initial?.price_per_m2 ?? ""));
//   const [infraCostM2, setInfraCostM2] = useState(String(initial?.infra_cost_per_m2 ?? ""));
//   const [varCostM2, setVarCostM2] = useState(String(initial?.variable_cost_per_m2 ?? ""));
//   const [fixedCosts, setFixedCosts] = useState(String(initial?.fixed_costs ?? ""));
//   const [commission, setCommission] = useState(String(initial?.commission_pct ?? "0.05")); // 5%
//   const [tax, setTax] = useState(String(initial?.tax_pct ?? "0.0"));

//   useEffect(() => {
//     onChange({
//       area: selectedArea ?? undefined,
//       title: title.trim(),
//       description: description.trim() || undefined,
//       pricing_mode: pricingMode,
//       lot_size_m2: Number(lotSize) || 0,
//       usable_ratio: Number(usable) || 0,
//       price_per_lot: pricePerLot ? Number(pricePerLot) : undefined,
//       price_per_m2: pricePerM2 ? Number(pricePerM2) : undefined,
//       infra_cost_per_m2: infraCostM2 ? Number(infraCostM2) : undefined,
//       variable_cost_per_m2: varCostM2 ? Number(varCostM2) : undefined,
//       fixed_costs: fixedCosts ? Number(fixedCosts) : undefined,
//       commission_pct: commission ? Number(commission) : undefined,
//       tax_pct: tax ? Number(tax) : undefined,
//     });
//   }, [selectedArea, title, description, pricingMode, lotSize, usable, pricePerLot, pricePerM2, infraCostM2, varCostM2, fixedCosts, commission, tax, onChange]);

//   // Cálculos de preview
//   const preview = useMemo(() => {
//     if (!selectedArea) return null;
//     const areaM2 = selectedArea.total_area_hectare * 10000;
//     const sellable = Math.max(0, (Number(usable) || 0) * areaM2);
//     const size = Math.max(1, Number(lotSize) || 0);
//     const lots = Math.floor(sellable / size);

//     let vgv = 0;
//     if (pricingMode === "PER_LOT") {
//       vgv = (Number(pricePerLot) || 0) * lots;
//     } else {
//       vgv = (Number(pricePerM2) || 0) * size * lots;
//     }

//     const infra = (Number(infraCostM2) || 0) * sellable;
//     const varCost = (Number(varCostM2) || 0) * sellable;
//     const fixed = Number(fixedCosts) || 0;
//     const commissionValue = vgv * (Number(commission) || 0);
//     const taxValue = vgv * (Number(tax) || 0);

//     const totalCosts = infra + varCost + fixed + commissionValue + taxValue;
//     const profit = vgv - totalCosts;
//     const margin = vgv > 0 ? profit / vgv : 0;

//     return { lots, vgv, totalCosts, profit, margin };
//   }, [selectedArea, usable, lotSize, pricingMode, pricePerLot, pricePerM2, infraCostM2, varCostM2, fixedCosts, commission, tax]);

//   return (
//     <View style={s.wrap}>
//       {/* Area picker simples: se quiser, troque por um Picker/Select do seu design */}
//       <Text style={s.label}>Área *</Text>
//       <TextInput
//         style={s.input}
//         placeholder="ID da área (seletor simples)"
//         value={areaId}
//         onChangeText={setAreaId}
//       />
//       {/* Dica: substitua este input por um picker visual. */}

//       <Text style={s.label}>Título *</Text>
//       <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Ex.: Cenário base" />

//       <Text style={s.label}>Descrição (opcional)</Text>
//       <TextInput style={s.input} value={description} onChangeText={setDescription} placeholder="Notas do cenário" />

//       <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
//         <Text style={s.label}>Preço por Lote</Text>
//         <Switch
//           value={pricingMode === "PER_M2"}
//           onValueChange={(v) => setPricingMode(v ? "PER_M2" : "PER_LOT")}
//         />
//         <Text style={s.label}>Preço por m²</Text>
//       </View>

//       <Text style={s.label}>Tamanho do lote (m²) *</Text>
//       <TextInput style={s.input} keyboardType="numeric" value={lotSize} onChangeText={setLotSize} placeholder="ex.: 200" />

//       <Text style={s.label}>Aproveitamento (0..1) *</Text>
//       <TextInput style={s.input} keyboardType="decimal-pad" value={usable} onChangeText={setUsable} placeholder="ex.: 0.6" />

//       {pricingMode === "PER_LOT" ? (
//         <>
//           <Text style={s.label}>Preço por lote</Text>
//           <TextInput style={s.input} keyboardType="decimal-pad" value={pricePerLot} onChangeText={setPricePerLot} placeholder="ex.: 30000" />
//         </>
//       ) : (
//         <>
//           <Text style={s.label}>Preço por m²</Text>
//           <TextInput style={s.input} keyboardType="decimal-pad" value={pricePerM2} onChangeText={setPricePerM2} placeholder="ex.: 150" />
//         </>
//       )}

//       <Text style={s.label}>Infra (R$/m²)</Text>
//       <TextInput style={s.input} keyboardType="decimal-pad" value={infraCostM2} onChangeText={setInfraCostM2} placeholder="ex.: 50" />

//       <Text style={s.label}>Custo variável (R$/m²)</Text>
//       <TextInput style={s.input} keyboardType="decimal-pad" value={varCostM2} onChangeText={setVarCostM2} placeholder="ex.: 20" />

//       <Text style={s.label}>Custos fixos (R$)</Text>
//       <TextInput style={s.input} keyboardType="decimal-pad" value={fixedCosts} onChangeText={setFixedCosts} placeholder="ex.: 100000" />

//       <Text style={s.label}>Comissão (%) 0..1</Text>
//       <TextInput style={s.input} keyboardType="decimal-pad" value={commission} onChangeText={setCommission} placeholder="ex.: 0.05" />

//       <Text style={s.label}>Impostos (%) 0..1</Text>
//       <TextInput style={s.input} keyboardType="decimal-pad" value={tax} onChangeText={setTax} placeholder="ex.: 0.0" />

//       {/* Preview */}
//       {selectedArea && preview && (
//         <View style={s.preview}>
//           <Text style={s.previewTitle}>Prévia</Text>
//           <Text>Lotes vendáveis: {preview.lots}</Text>
//           <Text>VGV: R$ {preview.vgv.toFixed(2)}</Text>
//           <Text>Custos: R$ {preview.totalCosts.toFixed(2)}</Text>
//           <Text>Lucro: R$ {preview.profit.toFixed(2)}</Text>
//           <Text>Margem: {(preview.margin * 100).toFixed(1)}%</Text>
//         </View>
//       )}
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   wrap: { gap: 12 },
//   label: { fontSize: 14, fontWeight: "600" },
//   input: {
//     borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
//     paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", fontSize: 16,
//   },
//   preview: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10 },
//   previewTitle: { fontWeight: "800", marginBottom: 6 },
// });
