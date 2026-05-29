import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import axios from "axios";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   client_secret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const resp = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, credentials);
          return resp.data.user;
        } catch (error: any) {
          console.error("Auth Error:", error.response?.data || error.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.department = (user as any).department;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).department = token.department;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});
