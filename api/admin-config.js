/**
 * Admin Configuration Endpoint
 * Returns public configuration for the admin dashboard.
 */
export default function handler(req, res) {
  res.status(200).json({
    platformName: process.env.NEXT_PUBLIC_PLATFORM_NAME || 'WHITESPACE',
    adminUrlToken: process.env.ADMIN_URL_TOKEN ? true : false,
    authModel: 'JWT',
    version: '1.0.0'
  });
}
