import NextAuth, { DefaultSession } from "next-auth";
import { adminDb } from "@/lib/firebase-admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "4c30c8df634f19b22a6bbffeb5e4d2938a16dbd76eaef6b3992b158021b777a8",
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: "__session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true
      }
    }
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username.toString().toLowerCase();

        // 1. Check hardcoded admin as fallback
        const adminUsername = process.env.ADMIN_USERNAME || "ADMIN";
        const adminPassword = process.env.ADMIN_PASSWORD || "123456";

        if (username === adminUsername.toLowerCase() && credentials.password === adminPassword) {
          return { id: "1", name: "Admin", email: "admin@habad.local", role: "ADMIN" };
        }

        // 2. Check Firestore
        try {
          const usersRef = adminDb.collection("users");
          const snapshot = await usersRef.where("username", "==", username).limit(1).get();
          
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            
            if (userData.password === credentials.password) {
              return { 
                id: userDoc.id, 
                name: userData.name || userData.username, 
                email: userData.email, 
                role: userData.role 
              };
            }
          }
        } catch (error) {
          console.error("Auth Error querying Firestore:", error);
        }

        return null;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      checks: ["none"],
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.role) {
        (session.user as any).role = token.role;
      }
      return session;
    },
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
});
