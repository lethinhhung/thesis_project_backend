export interface CreateLesson {
    courseId: string;
    title: String;
    content?: String;
    aiGenerated?: boolean;
}
