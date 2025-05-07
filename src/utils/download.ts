import { supabase } from '../config/supabase';

export const downloadDocumentUtils = async (userId: string, filePath: string) => {
    try {
        // Download file from Supabase
        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_DOCUMENTS_BUCKET_NAME!)
            .download(`${userId}/${filePath}`);

        if (error) {
            throw error;
        }

        // Return raw file data as ArrayBuffer
        return {
            data: await data.arrayBuffer(),
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error,
        };
    }
};
