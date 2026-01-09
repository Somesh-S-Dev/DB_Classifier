import { DBTable, Join } from '../types';

export function computeTableDegree(tables: DBTable[], joins: Join[]) {
    const degreeMap: Record<string, number> = {};

    tables.forEach(t => (degreeMap[t.table_name] = 0));

    joins.forEach(j => {
        if (degreeMap[j.leftTable] !== undefined) degreeMap[j.leftTable]++;
        if (degreeMap[j.rightTable] !== undefined) degreeMap[j.rightTable]++;
    });

    return degreeMap;
}

export function sortTablesForLayout(tables: DBTable[], joins: Join[]) {
    const degree = computeTableDegree(tables, joins);

    return [...tables].sort(
        (a, b) => (degree[b.table_name] || 0) - (degree[a.table_name] || 0)
    );
}

export function getTablePosition(
    index: number,
    columns = 3,
    cellWidth = 320,
    cellHeight = 300,
    padding = 40
) {
    const row = Math.floor(index / columns);
    const col = index % columns;

    return {
        top: row * cellHeight + padding,
        left: col * cellWidth + padding
    };
}
