import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen,
  Plus,
  Trash2,
  Upload,
  Link,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Globe,
  ChevronRight,
} from "lucide-react";
import { useDocumentCollections, type DocumentCollection, type Document } from "@/hooks/useDocumentCollections";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ALLOWED_URL_SCHEMES } from "@/config";

/** Validate that a URL is safe (http/https only, properly formed) */
function isValidUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    return ALLOWED_URL_SCHEMES.includes(url.protocol);
  } catch {
    return false;
  }
}

interface DocumentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
}

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".html", ".htm", ".json", ".csv", ".xml", ".yaml", ".yml", ".log"];

export function DocumentPanel({ open, onOpenChange, activeCollectionId, onSelectCollection }: DocumentPanelProps) {
  const { t } = useTranslation();
  const {
    collections,
    isLoading: collectionsLoading,
    fetchCollections,
    createCollection,
    deleteCollection,
    fetchDocuments,
    addDocument,
    deleteDocument,
  } = useDocumentCollections();

  const [view, setView] = useState<"collections" | "detail">("collections");
  const [activeCollection, setActiveCollection] = useState<DocumentCollection | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // New collection form
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);

  // Add document (file or URL)
  const [addMode, setAddMode] = useState<"file" | "url" | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [addError, setAddError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmations
  const [collectionToDelete, setCollectionToDelete] = useState<DocumentCollection | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  useEffect(() => {
    if (open) fetchCollections();
  }, [open, fetchCollections]);

  const openCollection = async (collection: DocumentCollection) => {
    setActiveCollection(collection);
    setView("detail");
    setDocsLoading(true);
    try {
      const docs = await fetchDocuments(collection.id);
      setDocuments(docs);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleBack = () => {
    setView("collections");
    setActiveCollection(null);
    setDocuments([]);
    setAddMode(null);
    setAddError("");
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      await createCollection(newCollectionName.trim());
      setNewCollectionName("");
      setShowNewCollectionForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;
    await deleteCollection(collectionToDelete.id);
    if (activeCollectionId === collectionToDelete.id) onSelectCollection(null);
    setCollectionToDelete(null);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    await deleteDocument(documentToDelete.id);
    setDocuments(prev => prev.filter(d => d.id !== documentToDelete.id));
    setDocumentToDelete(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !activeCollection) return;
    setUploadingFile(true);
    setAddError("");
    let hasError = false;

    for (const file of Array.from(files)) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        setAddError(t("docs.unsupportedFormat", { name: file.name }));
        hasError = true;
        continue;
      }
      try {
        const content = await file.text();
        const doc = await addDocument(activeCollection.id, {
          name: file.name.replace(/\.[^/.]+$/, ""),
          content,
          source_type: "file",
          file_name: file.name,
          file_size: file.size,
        });
        setDocuments(prev => [doc, ...prev]);
      } catch (err) {
        setAddError(err instanceof Error ? err.message : t("docs.uploadFailed"));
        hasError = true;
      }
    }

    if (!hasError) setAddMode(null);
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim() || !activeCollection) return;
    // Security: validate URL scheme before sending to backend
    if (!isValidUrl(urlInput.trim())) {
      setAddError(t("docs.invalidUrl", "Invalid URL. Only http:// and https:// are allowed."));
      return;
    }
    setFetchingUrl(true);
    setAddError("");
    try {
      const { data, error } = await supabase.functions.invoke("fetch-url-content", {
        body: { url: urlInput.trim() },
      });
      
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      const doc = await addDocument(activeCollection.id, {
        name: data.title || new URL(urlInput.trim()).hostname,
        content: data.content,
        source_type: "url",
        source_url: urlInput.trim(),
      });
      setDocuments(prev => [doc, ...prev]);
      setUrlInput("");
      setAddMode(null);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : t("docs.fetchFailed"));
    } finally {
      setFetchingUrl(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[360px] sm:w-[420px] flex flex-col p-0 gap-0" aria-describedby={undefined}>
          <SheetHeader className="px-5 py-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              {view === "detail" && (
                <Button variant="ghost" size="icon" className="h-7 w-7 -ml-1" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <FolderOpen className="h-5 w-5 text-primary" />
              <SheetTitle className="text-base">
                {view === "collections" ? t("docs.title") : (activeCollection?.name || t("docs.collection"))}
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Collections view */}
          {view === "collections" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {collectionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : collections.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t("docs.noCollections")}</p>
                  </div>
                ) : (
                  collections.map(col => (
                    <div
                      key={col.id}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all",
                        "hover:bg-muted/60 hover:border-primary/20",
                        activeCollectionId === col.id && "bg-primary/5 border-primary/30"
                      )}
                      onClick={() => openCollection(col)}
                    >
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        activeCollectionId === col.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <FolderOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{col.name}</p>
                          {activeCollectionId === col.id && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        {col.description && (
                          <p className="text-xs text-muted-foreground truncate">{col.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); setCollectionToDelete(col); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))
                )}
              </div>

              {/* New collection form */}
              <div className="p-4 border-t shrink-0 space-y-2">
                {showNewCollectionForm ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("docs.collectionNamePlaceholder")}
                      value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleCreateCollection(); if (e.key === "Escape") setShowNewCollectionForm(false); }}
                      autoFocus
                      className="text-sm"
                    />
                    <Button size="sm" onClick={handleCreateCollection} disabled={creatingCollection || !newCollectionName.trim()}>
                      {creatingCollection ? <Loader2 className="h-4 w-4 animate-spin" /> : t("docs.create")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewCollectionForm(false)}>
                      {t("docs.cancel")}
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowNewCollectionForm(true)}>
                    <Plus className="h-4 w-4" />
                    {t("docs.newCollection")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Collection detail view */}
          {view === "detail" && activeCollection && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Active toggle */}
              <div className="px-4 py-3 border-b shrink-0">
                {activeCollectionId === activeCollection.id ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                    onClick={() => onSelectCollection(null)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t("docs.deactivate")}
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2"
                    onClick={() => onSelectCollection(activeCollection.id)}
                  >
                    {t("docs.useAsContext")}
                  </Button>
                )}
              </div>

              {/* Documents list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {docsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t("docs.noDocuments")}</p>
                  </div>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="group flex items-start gap-3 px-3 py-2.5 rounded-lg border hover:bg-muted/40 transition-colors">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        {doc.source_type === "url" ? (
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.source_type === "url" ? doc.source_url : doc.file_name}
                          {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.content.length.toLocaleString()} {t("docs.chars")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-opacity"
                        onClick={() => setDocumentToDelete(doc)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add document area */}
              <div className="p-4 border-t shrink-0 space-y-3">
                {addError && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{addError}</p>
                )}

                {addMode === "url" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="https://example.com"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleAddUrl(); if (e.key === "Escape") { setAddMode(null); setAddError(""); } }}
                      autoFocus
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddUrl} disabled={fetchingUrl || !urlInput.trim()} className="flex-1">
                        {fetchingUrl ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />{t("docs.fetching")}</> : t("docs.addUrl")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAddMode(null); setAddError(""); }}>{t("docs.cancel")}</Button>
                    </div>
                  </div>
                )}

                {addMode !== "url" && (
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={SUPPORTED_EXTENSIONS.join(",")}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => { setAddMode("file"); setAddError(""); fileInputRef.current?.click(); }}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {t("docs.uploadFile")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => { setAddMode("url"); setAddError(""); }}
                    >
                      <Link className="h-4 w-4" />
                      {t("docs.addWebsite")}
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  {t("docs.supportedFormats")}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete collection confirmation */}
      <AlertDialog open={!!collectionToDelete} onOpenChange={open => !open && setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("docs.deleteCollectionTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("docs.deleteCollectionDesc", { name: collectionToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("docs.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("docs.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete document confirmation */}
      <AlertDialog open={!!documentToDelete} onOpenChange={open => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("docs.deleteDocTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("docs.deleteDocDesc", { name: documentToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("docs.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("docs.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
