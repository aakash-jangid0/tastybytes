import React from 'react';
import { FileText, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface StaffDocument {
  id: string;
  staff_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  category: string;
  expiry_date?: string;
  status: 'active' | 'expired' | 'pending';
  file_url: string;
  is_verified: boolean;
}

interface DocumentManagementProps {
  documents: StaffDocument[];
  onUploadDocument: (file: File, category: string) => void;
  onDeleteDocument: (id: string) => void;
  onVerifyDocument: (id: string) => void;
  staffMember: { id: string; full_name: string };
}

const statusIcon: Record<string, React.ReactNode> = {
  active: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  pending: <Clock className="w-4 h-4 text-yellow-500" />,
  expired: <AlertTriangle className="w-4 h-4 text-red-500" />,
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentManagement: React.FC<DocumentManagementProps> = ({
  documents,
  onDeleteDocument,
  onVerifyDocument,
}) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FileText className="w-5 h-5" /> Documents
      </h3>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              {statusIcon[doc.status] || statusIcon.pending}
              <div>
                <p className="text-sm font-medium text-gray-800">{doc.file_name}</p>
                <p className="text-xs text-gray-500">
                  {doc.category} &middot; {formatSize(doc.file_size)} &middot; {new Date(doc.upload_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!doc.is_verified && (
                <button
                  onClick={() => onVerifyDocument(doc.id)}
                  className="text-emerald-500 hover:text-emerald-700 text-xs font-medium"
                >
                  Verify
                </button>
              )}
              <button onClick={() => onDeleteDocument(doc.id)} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentManagement;
