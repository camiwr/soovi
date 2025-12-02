import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Receivable = {
  year: number;
  value: number;
};

type ReceivablesTableProps = {
  data: Receivable[];
};

const ReceivablesTable: React.FC<ReceivablesTableProps> = ({ data }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Ano</Text>
        <Text style={styles.headerCell}>Valor</Text>
      </View>
      {data.map((item, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.cell}>{item.year}</Text>
          <Text style={styles.cell}>{(item.value ?? 0).toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 10,
  },
  headerCell: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  cell: {
    flex: 1,
    textAlign: "center",
  },
});

export default ReceivablesTable;