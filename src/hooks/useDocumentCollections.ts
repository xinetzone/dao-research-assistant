import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentCollection {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
}

export interface Document {
  id: string;
  collection_id: string;
  name: string;
  content: string;
  source_type: "file" | "url";
  source_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string | null;
}

export function useDocumentCollections() {
  const [collections, setCollections] = useState<DocumentCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("document_collections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch collections");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCollection = useCallback(async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from("document_collections")
      .insert({ name, description: description || "" })
      .select()
      .single();
    if (error) throw error;
    setCollections(prev => [data, ...prev]);
    return data;
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("document_collections")
      .delete()
      .eq("id", id);
    if (error) throw error;
    setCollections(prev => prev.filter(c => c.id !== id));
  }, []);

  const fetchDocuments = useCallback(async (collectionId: string): Promise<Document[]> => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as Document[];
  }, []);

  const addDocument = useCallback(async (
    collectionId: string,
    doc: {
      name: string;
      content: string;
      source_type: "file" | "url";
      source_url?: string;
      file_name?: string;
      file_size?: number;
    }
  ): Promise<Document> => {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        collection_id: collectionId,
        name: doc.name,
        content: doc.content,
        source_type: doc.source_type,
        source_url: doc.source_url || null,
        file_name: doc.file_name || null,
        file_size: doc.file_size || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Document;
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);
    if (error) throw error;
  }, []);

  const getCollectionContext = useCallback(async (collectionId: string): Promise<string> => {
    const docs = await fetchDocuments(collectionId);
    if (docs.length === 0) return "";
    const parts = docs.map(d => "## " + d.name + "\n\n" + d.content);
    return parts.join("\n\n---\n\n");
  }, [fetchDocuments]);

  return {
    collections,
    isLoading,
    error,
    fetchCollections,
    createCollection,
    deleteCollection,
    fetchDocuments,
    addDocument,
    deleteDocument,
    getCollectionContext,
  };
}
