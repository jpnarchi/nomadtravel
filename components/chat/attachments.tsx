import Image from "next/image";

export function Attachments({
    files,
}: {
    files: { url: string, type: string }[];
}) {
    return (
        <div className="flex flex-row gap-3 items-start mt-2 pl-8">
            <div className="flex flex-wrap gap-2">
                {files && files.map((file, fileIndex) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                        <div key={fileIndex} className="relative group">
                            {isImage ? (
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                    <div className="w-28 h-28 rounded-md border border-border bg-muted overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                                        <Image
                                            src={file.url}
                                            alt="Attached file"
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </a>
                            ) : (
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                    <div className="w-32 h-32 rounded-md border border-border bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                                        <div className="text-sm text-center px-2 truncate w-full">
                                            {file.type.split('/').pop()?.toUpperCase()}
                                        </div>
                                    </div>
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}