"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface CreateTicketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedChatId, setSelectedChatId] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const chats = useQuery(api.chats.getAll);
    const createTicket = useMutation(api.supportTickets.create);
    const generateUploadUrl = useMutation(api.supportTickets.generateUploadUrl);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files);
            setFiles((prev) => [...prev, ...newFiles]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        if (!description.trim()) {
            toast.error("Please enter a description");
            return;
        }

        setIsSubmitting(true);

        try {
            // Upload files if any
            const attachments = [];
            if (files.length > 0) {
                for (const file of files) {
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                    });
                    const { storageId } = await result.json();

                    attachments.push({
                        storageId,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                    });
                }
            }

            // Create the ticket
            await createTicket({
                title: title.trim(),
                description: description.trim(),
                chatId: selectedChatId ? (selectedChatId as Id<"chats">) : undefined,
                attachments: attachments.length > 0 ? attachments : undefined,
            });

            toast.success("Ticket created successfully");

            // Reset form
            setTitle("");
            setDescription("");
            setSelectedChatId("");
            setFiles([]);
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating ticket:", error);
            toast.error("Failed to create ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setTitle("");
            setDescription("");
            setSelectedChatId("");
            setFiles([]);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Ticket</DialogTitle>
                    <DialogDescription>
                        Describe your issue and we'll get back to you as soon as possible
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="E.g: Error loading dashboard"
                            value={title}
                            onChange={(e) => setTitle(e.target.value.slice(0, 30))}
                            maxLength={30}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            {title.length}/30 characters
                        </p>
                    </div>

                    {/* Chat Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="chat">Related Chat (Optional)</Label>
                        <Select
                            value={selectedChatId}
                            onValueChange={setSelectedChatId}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="chat">
                                <SelectValue placeholder="Select a chat" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {chats?.map((chat) => (
                                    <SelectItem key={chat._id} value={chat._id}>
                                        {chat.title || "Untitled Chat"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the problem with as much detail as possible..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            {description.length} characters
                        </p>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label>Attachments (Optional)</Label>
                        <div
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                                disabled={isSubmitting}
                            />
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                Drag files here or click to select
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Supports images, PDFs, documents, etc.
                            </p>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2 mt-4">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                            disabled={isSubmitting}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Ticket"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
