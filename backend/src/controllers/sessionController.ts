import { Response } from 'express';
import pool from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { writeFile, readFile, mkdir, unlink, access } from 'fs/promises';
import path from 'path';
import os from 'os';

const WORKSPACE_DIR = path.join(os.homedir(), 'DB_Classifier_Workspace');

export const saveSession = async (req: AuthRequest, res: Response) => {
    // New payload structure: { sessionData, sourceData }
    const { sessionData, sourceData } = req.body;
    const userId = req.user?.id;

    // Use a single timestamp to avoid mismatch between filename and frontend ID
    const timestamp = Date.now();
    const sessionIdFrontend = `session_${timestamp}`;

    try {
        await mkdir(WORKSPACE_DIR, { recursive: true });

        const sessionFileName = `session_${timestamp}.json`;
        const sourceFileName = `source_${timestamp}.json`;

        const sessionPath = path.join(WORKSPACE_DIR, sessionFileName);
        const sourcePath = path.join(WORKSPACE_DIR, sourceFileName);

        const finalSessionData = sessionData || req.body;

        await writeFile(sessionPath, JSON.stringify(finalSessionData, null, 2));
        if (sourceData) {
            await writeFile(sourcePath, JSON.stringify(sourceData, null, 2));
        }

        const dbData = {
            session_file_path: sessionPath,
            source_file_path: sourceData ? sourcePath : null,
            legacy_data: !sessionData
        };

        const result = await pool.query(
            'INSERT INTO classifier_sessions (user_id, session_id_frontend, data) VALUES ($1, $2, $3) RETURNING id',
            [userId, sessionIdFrontend, JSON.stringify(dbData)]
        );

        res.json({ message: 'Session saved to workspace', id: result.rows[0].id, session_id: sessionIdFrontend });
    } catch (err: any) {
        console.error('Save error:', err);
        res.status(500).json({ message: err.message });
    }
};

export const listSessions = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    try {
        // Only return non-deleted sessions
        const result = await pool.query(
            "SELECT id, session_id_frontend, data, created_at, updated_at FROM classifier_sessions WHERE user_id = $1 AND (deleted IS NULL OR deleted = '0') ORDER BY updated_at DESC",
            [userId]
        );

        const sessions = await Promise.all(result.rows.map(async (row) => {
            let isLocal = false;
            if (row.data && row.data.session_file_path) {
                try {
                    await access(row.data.session_file_path);
                    isLocal = true;
                } catch {
                    isLocal = false;
                }
            }
            return {
                id: row.id,
                session_id_frontend: row.session_id_frontend,
                created_at: row.created_at,
                updated_at: row.updated_at,
                is_local: isLocal
            };
        }));

        res.json(sessions);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Get the session details to find file paths
        const result = await pool.query(
            'SELECT * FROM classifier_sessions WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const record = result.rows[0];
        const responseData = record.data;

        // 2. Delete files from local system
        if (responseData.session_file_path) {
            try {
                await unlink(responseData.session_file_path);
            } catch (e) {
                console.warn('Could not delete session file:', e);
            }
        }
        if (responseData.source_file_path) {
            try {
                await unlink(responseData.source_file_path);
            } catch (e) {
                console.warn('Could not delete source file:', e);
            }
        }

        // 3. Mark as deleted in DB
        await pool.query(
            "UPDATE classifier_sessions SET deleted = '1' WHERE id = $1",
            [id]
        );

        res.json({ message: 'Session deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getSession = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        const result = await pool.query(
            'SELECT * FROM classifier_sessions WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const record = result.rows[0];
        // If it's already deleted logically, we should probably fail or handle it
        if (record.deleted === '1') {
            return res.status(404).json({ message: 'Session has been deleted' });
        }

        let responseData = record.data;

        if (responseData.session_file_path) {
            try {
                const sessionContent = await readFile(responseData.session_file_path, 'utf-8');
                const sessionJson = JSON.parse(sessionContent);

                let sourceJson = null;
                if (responseData.source_file_path) {
                    try {
                        const sourceContent = await readFile(responseData.source_file_path, 'utf-8');
                        sourceJson = JSON.parse(sourceContent);
                    } catch (e) {
                        console.warn('Could not read source file:', e);
                    }
                }

                responseData = {
                    ...sessionJson,
                    sourceData: sourceJson
                };
            } catch (e) {
                console.error('File read error:', e);
                return res.status(500).json({ message: 'Workspace file missing or corrupt' });
            }
        }

        res.json({ ...record, data: responseData });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getLatestSession = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    try {
        const result = await pool.query(
            "SELECT * FROM classifier_sessions WHERE user_id = $1 AND (deleted IS NULL OR deleted = '0') ORDER BY created_at DESC LIMIT 1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No sessions found' });
        }

        const record = result.rows[0];
        let responseData = record.data;

        if (responseData.session_file_path) {
            const sessionContent = await readFile(responseData.session_file_path, 'utf-8');
            const sessionJson = JSON.parse(sessionContent);
            let sourceJson = null;
            if (responseData.source_file_path) {
                const sourceContent = await readFile(responseData.source_file_path, 'utf-8');
                sourceJson = JSON.parse(sourceContent);
            }
            responseData = { ...sessionJson, sourceData: sourceJson };
        }

        res.json({ ...record, data: responseData });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const exportSession = async (req: AuthRequest, res: Response) => {
    const { moduleAssignments, moduleData, moduleNames } = req.body;

    if (!moduleAssignments || !moduleData) {
        return res.status(400).json({ message: 'Missing module data for export' });
    }

    try {
        const exportedModules = [];

        // Iterate through all modules that have assignments
        for (const [moduleKey, tables] of Object.entries(moduleAssignments)) {
            const tableNames = tables as string[];
            if (tableNames.length === 0) continue;

            const mData = (moduleData as any)[moduleKey] || {};
            const readableName = (moduleNames as any)?.[moduleKey] || moduleKey;

            const moduleExport = {
                name: readableName,
                description: mData.description || '',
                keywords: mData.keywords || [],
                used_tables: tableNames,
                tables: tableNames.map(tableName => {
                    const tableMeta = (mData.tableMetadata || {})[tableName] || {};
                    const includedCols = (mData.includedColumns || {})[tableName] || [];

                    return {
                        name: tableName,
                        description: tableMeta.description || '',
                        keywords: tableMeta.keywords || [],
                        columns: includedCols.map((col: string) => `${tableName}.${col}`)
                    };
                }),
                joins: mData.joins || []
            };

            exportedModules.push(moduleExport);
        }

        const finalJson = {
            version: '2.5.9',
            exported_at: new Date().toISOString(),
            modules: exportedModules
        };

        // We return the JSON as an object, frontend will handle the download blobbing if needed
        // or we can send as a file. Given the requirement "sends the file to frontend and it downloads",
        // setting headers is good.
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=DB_Classifier_Export_${Date.now()}.json`);
        res.status(200).send(JSON.stringify(finalJson, null, 2));
    } catch (err: any) {
        console.error('Export error:', err);
        res.status(500).json({ message: err.message });
    }
};
