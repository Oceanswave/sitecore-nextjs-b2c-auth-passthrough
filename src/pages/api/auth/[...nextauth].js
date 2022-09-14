import NextAuth from "next-auth"
import AzureADB2CProvider from "next-auth/providers/azure-ad-b2c"
export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    AzureADB2CProvider({
      tenantId: process.env.AZURE_AD_B2C_TENANT_NAME,
      clientId: process.env.AZURE_AD_B2C_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET,
      primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW,
      authorization: { params: { scope: `https://${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/api/api.read https://${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/api/api.write offline_access openid` } },
    }),
    // ...add more providers here
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth id_token to the token right after signin
      if (account) {
        token.id_token = account.id_token
      }
      return token
    },
    async session({ session, token, user }) {
      session.id_token = token.id_token
      return session
    }
  }
}
export default NextAuth(authOptions)