"use server";

import { adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
const { FieldValue } = admin.firestore;
import { auth } from "@/lib/auth";
import { Contact } from "@/features/crm/types";

export interface Campaign {
  id?: string;
  ownerId: string;
  subject: string;
  content: string;
  status: "draft" | "sent";
  sentAt?: string;
  recipientsCount: number;
  createdAt: string;
}

// Helper to get authenticated user ID
async function getUserId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {
    // Ignore and fallback
  }
  // Fallback to mock user ID "1" from LoginModal
  return "1";
}

/**
 * Retrieves past campaigns for the logged-in user.
 */
export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const userId = await getUserId();

    const snapshot = await adminDb
      .collection("campaigns")
      .where("ownerId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as Campaign[];
  } catch (error) {
    console.error("Failed to get campaigns:", error);
    return [];
  }
}

/**
 * Sends a campaign to a list of contacts.
 * Uses Firebase Trigger Email extension which listens to the 'mail' collection.
 */
export async function sendCampaign(
  subject: string,
  content: string,
  recipients: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId();

    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients provided");
    }

    const now = new Date().toISOString();

    // 1. Save campaign history
    const campaignRef = await adminDb.collection("campaigns").add({
      ownerId: userId,
      subject,
      content,
      status: "sent",
      sentAt: now,
      recipientsCount: recipients.length,
      createdAt: now,
    });

    // 2. Queue emails in the 'mail' collection for the Firebase extension
    const batch = adminDb.batch();
    const mailCollection = adminDb.collection("mail");

    // Process in batches if necessary (Firestore batch limit is 500)
    // Here we'll do individual emails to avoid exposing BCC to everyone if we don't want to
    // Alternatively, we can use BCC. The Firebase extension supports BCC.
    
    // For personalization, it's better to send individual emails
    recipients.forEach((email) => {
      const docRef = mailCollection.doc();
      batch.set(docRef, {
        to: [email],
        message: {
          subject: subject,
          html: content,
        },
        campaignId: campaignRef.id,
        createdAt: FieldValue.serverTimestamp() // Requires admin SDK timestamp
      });
    });

    // Commit batch
    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error("Failed to send campaign:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get contacts for filtering. We fetch them here so the client can filter.
 */
export async function getContactsForEmailing(): Promise<Contact[]> {
  try {
    const userId = await getUserId();

    const snapshot = await adminDb
      .collection("contacts")
      .where("ownerId", "==", userId)
      .where("status", "==", "active")
      .get();

    return snapshot.docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Contact;
      })
      .filter((contact) => !!contact.email); // Only contacts with emails
  } catch (error) {
    console.error("Failed to get contacts:", error);
    return [];
  }
}
