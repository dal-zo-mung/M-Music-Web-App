import { model, Schema, type HydratedDocument } from "mongoose";

export type LegalDocType = "terms" | "privacy" | "copyright";

export interface LegalDocumentPersistenceRecord {
  type: LegalDocType;
  title: string;
  content: string;
}

const legalDocumentSchema = new Schema<LegalDocumentPersistenceRecord>(
  {
    type: {
      enum: ["terms", "privacy", "copyright"],
      required: true,
      type: String,
      unique: true,
    },
    title: { required: true, trim: true, type: String },
    content: { default: "", type: String },
  },
  {
    collection: "legal_documents",
    timestamps: true,
  },
);

export type LegalDocumentDocument =
  HydratedDocument<LegalDocumentPersistenceRecord>;

export const LegalDocumentModel = model<LegalDocumentPersistenceRecord>(
  "LegalDocument",
  legalDocumentSchema,
  "legal_documents",
);

// ── Seed default legal documents ─────────────────────────────────────────────

export async function seedLegalDocuments(): Promise<void> {
  const defaults: Array<{
    type: LegalDocType;
    title: string;
    content: string;
  }> = [
    {
      type: "terms",
      title: "Terms & Conditions",
      content: `# Terms & Conditions\n\nLast updated: ${new Date().getFullYear()}\n\nBy downloading and using M-Music, you agree to these terms.\n\n## Usage\nM-Music is provided for music discovery and worship presentation use. You may not redistribute the application without permission.\n\n## Content\nYou are responsible for any content you submit to the platform.`,
    },
    {
      type: "privacy",
      title: "Privacy Policy",
      content: `# Privacy Policy\n\nLast updated: ${new Date().getFullYear()}\n\nThis policy explains how M-Music collects and uses your data.\n\n## Data We Collect\n- Account information (username, email)\n- Usage data (songs viewed, favorites)\n\n## How We Use It\nWe use your data to provide and improve the service.`,
    },
    {
      type: "copyright",
      title: "Copyright Notice",
      content: `# Copyright Notice\n\nLast updated: ${new Date().getFullYear()}\n\nAll song lyrics displayed on M-Music are used for educational and worship purposes. All rights remain with their respective owners.`,
    },
  ];

  for (const doc of defaults) {
    await LegalDocumentModel.updateOne(
      { type: doc.type },
      { $setOnInsert: { title: doc.title, content: doc.content } },
      { upsert: true },
    );
  }
}
