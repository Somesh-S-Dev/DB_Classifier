import { Module, MODULE_NAMES, DBTable, Join } from '../types';

export function exportModule(
    module: Module,
    tables: string[],
    allDbTables: DBTable[],
    joins: Join[],
    includedColumnsMap: Record<string, string[]>,
    description?: string,
    keywords?: string[],
    tableMetadata?: Record<string, { description?: string; keywords?: string[] }>
) {
    // Filter and map tables to include their full structure, respecting pruning
    const moduleTables = allDbTables
        .filter(t => tables.includes(t.table_name))
        .map(t => {
            const includedCols = includedColumnsMap[t.table_name];
            const metadata = tableMetadata?.[t.table_name] || {};
            // If no record exists for includedColumns, assume ALL (backward compatibility/safety)
            // But if it exists, use it.
            const validColumns = includedCols
                ? t.columns.filter(c => includedCols.includes(c.name))
                : t.columns;

            return {
                name: t.table_name,
                description: metadata.description || '',
                keywords: metadata.keywords || [],
                columns: validColumns,
                primary_keys: t.primary_keys.filter(pk => validColumns.some(vc => vc.name === pk)),
                foreign_keys: t.foreign_keys.filter(fk => validColumns.some(vc => vc.name === fk.column))
            };
        })
        .filter(t => t.columns.length > 0); // Exclude tables with 0 columns


    // Filter joins: Both sides must exist in the exported tables and columns
    const validJoins = joins.filter(j => {
        const leftTable = moduleTables.find(t => t.name === j.leftTable);
        const rightTable = moduleTables.find(t => t.name === j.rightTable);

        if (!leftTable || !rightTable) return false;

        const leftColExists = leftTable.columns.some(c => c.name === j.leftColumn);
        const rightColExists = rightTable.columns.some(c => c.name === j.rightColumn);

        return leftColExists && rightColExists;
    });

    const payload = {
        module: {
            id: module,
            name: MODULE_NAMES[module],
            description: description || '',
            keywords: keywords || [],
            tableCount: moduleTables.length
        },
        tables: moduleTables,
        joins: validJoins.map(j => ({
            id: j.id,
            leftTable: j.leftTable,
            leftColumn: j.leftColumn,
            rightTable: j.rightTable,
            rightColumn: j.rightColumn,
            type: j.type
        }))
    };

    const blob = new Blob(
        [JSON.stringify(payload, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${MODULE_NAMES[module].replace(/\s+/g, '_')}_classified.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}
