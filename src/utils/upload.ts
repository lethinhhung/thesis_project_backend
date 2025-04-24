import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

export const uploadAvatar = async (userId: string, file: Express.Multer.File) => {
    try {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_AVATARS_BUCKET_NAME!)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            throw error;
        }

        const { data: publicUrl } = supabase.storage
            .from(process.env.SUPABASE_AVATARS_BUCKET_NAME!)
            .getPublicUrl(filePath);

        return {
            url: publicUrl.publicUrl,
            path: filePath,
        };
    } catch (error) {
        throw error;
    }
};

export const deleteAvatar = async (userId: string, path: string) => {
    try {
        const fileName = path.split('/').pop();
        console.log('fileName', fileName);
        const { error } = await supabase.storage
            .from(process.env.SUPABASE_AVATARS_BUCKET_NAME!)
            .remove([`${userId}/${fileName}`]);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        throw error;
    }
};
