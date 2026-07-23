/**
 * Completion Badge Detection — Image URL based
 *
 * Badge image URLs from cdn.qwiklabs.com are IDENTICAL for all users
 * who earned the same badge. So we use image URL (or its hash part)
 * to identify completion badges reliably across all users.
 *
 * How to identify: open the badge image URL, if it shows
 * "COMPLETION BADGE" with blue checkmark → add it here.
 *
 * Format: the encoded path part of the cdn.qwiklabs.com URL
 * e.g. for https://cdn.qwiklabs.com/trCZwK0Hdr%2FpsCC0BqzQUWJ97KmXJYa662iHvG4E1wk%3D
 * use the full URL as key.
 */

// Map of known completion badge image URLs
export const COMPLETION_BADGE_IMAGE_URLS = new Set<string>([
  // Introduction to Looker (confirmed screenshot)
  "https://cdn.qwiklabs.com/trCZwK0Hdr%2FpsCC0BqzQUWJ97KmXJYa662iHvG4E1wk%3D",
  // Model Armor: Securing AI Deployments (confirmed screenshot)
  "https://cdn.qwiklabs.com/XIa%2F%2Ffn8C0onBFXCyfnjG%2BdWexEicvmuC4MLemRkg5s%3D",
  // Scaling with Google Cloud Operations (confirmed screenshot - blue checkmark)
  "https://cdn.qwiklabs.com/coKJmgcXaYPqgGRJMw7chXKe8NrmJjP6nxMtNeLeAX4%3D",
  // Trust and Security with Google Cloud
  "https://cdn.qwiklabs.com/R8x3Dpf7T%2BKRWuyiZMPAqzHMaYwqXeHYNgvbEFzC8xw%3D",
  // Modernize Infrastructure and Applications with Google Cloud
  "https://cdn.qwiklabs.com/y%2FA4TOtFrN2A8M87WG22v7seJt7XKiZSkQ5SDEEvj8c%3D",
  // Innovating with Google Cloud Artificial Intelligence
  "https://cdn.qwiklabs.com/jULuQ0vz8SBdnJXxmxWT4RQXgtLORCEc%2Bwj26vm9kFo%3D",
  // Exploring Data Transformation with Google Cloud
  "https://cdn.qwiklabs.com/yU2o843A%2BN66CzNyT%2BzBr2ll%2BfHRNjy38qnGnXrwypA%3D",
  // Digital Transformation with Google Cloud
  "https://cdn.qwiklabs.com/OdaRYr%2BecRPom57iELk9k4eY8cUWXBEmwF6%2Bk6F%2B0P8%3D",
  // Machine Learning Operations (MLOps) with Agent Platform: Model Evaluation
  "https://cdn.qwiklabs.com/KdjGcSRsPB4z5kS0FfiWJn%2BO62z9TJriqAQZq45PSkQ%3D",
  // Machine Learning Operations (MLOps) with Agent Platform: Model Evaluation (variant 2)
  "https://cdn.qwiklabs.com/1xQvI5YGM7tHDBpNtV1yTFnfiJMApv4LvyrazZ8qEqo%3D",
  // Machine Learning Operations (MLOps) for Generative AI
  "https://cdn.qwiklabs.com/BVV%2Fj%2F0h1ZRwMel0M0Ip3uZcNXd%2FzeWEqkZLZ2umN3E%3D",
  // Introduction to Data Analytics on Google Cloud (confirmed screenshot)
  "https://cdn.qwiklabs.com/URJ0BFWgzlLBkCO6kSOyXGd3Idd44d6tC4Dqn6SKeiw%3D",
  // Introduction to reCAPTCHA (image URL from Erik's profile)
  "https://cdn.qwiklabs.com/RQM7goFF%2BdDO6G8hN7qDT%2F9iBEqEa7%2F3uvu%2FZEDYlEE%3D",
  // Introduction to Google Distributed Cloud Sandbox
  "https://cdn.qwiklabs.com/m%2BvV7K9yMg5CaMQAvQoUF9CeBTOUaIjz5PX88ZNEt3g%3D",
  // Introduction Google Security Operations (SOAR)
  "https://cdn.qwiklabs.com/vteC0ZpdDq82lB3N8Pg1WCf9SNTcixt4XVNHwKiFh%2FE%3D",
  // Introduction to AI Agents
  "https://cdn.qwiklabs.com/7xFCpXl6c41wp0LLllrB7TUvpcYBIcfIbPMjsKESjGQ%3D",
  // Migrating to Google Cloud: Fundamentals
  "https://cdn.qwiklabs.com/KmY0Q7p0VMstD87apSLAUOy1hm%2BB9wxtVpa4EKgHsUU%3D",
  // Agent Fundamentals
  "https://cdn.qwiklabs.com/47eD8IG90fUEGDRKLwJq3Nk8hqpDAQk6Q5BksjZW%2FOY%3D",
  // Future-Proof Your AI Learning Strategy
  "https://cdn.qwiklabs.com/1L%2FejhOb2IyRb6t1RmuFjJs029%2BaImLygGqXMHJ04l4%3D",
  // Build a Certification Study Guide: PMLE
  "https://cdn.qwiklabs.com/CprFvK279AEQxMaqfP8fZeVk8L2qN0l8ejDSKsRIv9k%3D",
  // Gen AI: Navigate the Landscape
  "https://cdn.qwiklabs.com/p7HnLAA3bLUMFdoJ1p4iKj3fISp9aEOqCo2m68MYic4%3D",
  // Gen AI: Beyond the Chatbot
  "https://cdn.qwiklabs.com/wqt6LSlYYBvBzJlmlK33S0Omqoi%2FOB7Cc4HYczibtvo%3D",
  // Gen AI Apps: Transform Your Work
  "https://cdn.qwiklabs.com/9O2IRFwesEmalG0DGGZ2cjVVE7GzSClBz5xBIMzH%2BZ4%3D",
  // Gen AI: Unlock Foundational Concepts
  "https://cdn.qwiklabs.com/QCFXLKG7%2FPZPSCEdaIkdbwJaJKWQFUYITkYLPApMkcg%3D",
  // Unlock Insights with NotebookLM
  "https://cdn.qwiklabs.com/Nat%2BZ3bLsyiPTEkmqzGput6jSfCZf511PZVeMOWdhJI%3D",
  // Architect Gemini Enterprise for Customer Experience
  "https://cdn.qwiklabs.com/%2Fw9OEfDEdnscR5nuGkJP7sWKPSRSlZK8%2Bqa0DU7W0iE%3D",
  // Build Agents with Agent Development Kit (ADK)
  "https://cdn.qwiklabs.com/U%2FprxNLb43rE1WzhP6gxt12JemWn2ucRkE80n9p0GW8%3D",
  // Strategies for Cloud Security Risk Management
  "https://cdn.qwiklabs.com/LzXaE7St6P4eHdAwx3t%2FChY4XR4We40E6JfSPORBT0Y%3D",
  // Google Workspace Troubleshooting
  "https://cdn.qwiklabs.com/q6jcObo2nq%2BECEMNhwWFG6nUmzpvIToyj%2ByHtteWBgk%3D",
  // Deploy and Scale AI Models with Cloud Run
  "https://cdn.qwiklabs.com/6ZDX%2BW1AZnaFpO5lLlthas3gcLpTin%2FX52%2BPitJL%2FZ8%3D",
  // Build Your First Agent with Agent Development Kit (ADK)
  "https://cdn.qwiklabs.com/BkhO4P7tVlJiOZ7MNdKg7o%2BttHOcJHBBHz%2BqeGsR7N4%3D",
  // AI Infrastructure: Introduction to AI Hypercomputer
  "https://cdn.qwiklabs.com/nK9hQxanudyuRC1BvmYXupqpxAadYMAJRjjehG%2FKsdc%3D",
  // Preparing for Your Professional Cloud Security Engineer Journey
  "https://cdn.qwiklabs.com/YZ%2F8nCVNUQAbHdDy7ZmIGFbCurn3i8BiUUNhWNIai4A%3D",
  // Introduction to Cloud Identity
  "https://cdn.qwiklabs.com/qahOBm2tlWmQsp83hDK1jRlZk8PqltRFx9dM5D2aGiY%3D",
]);

/**
 * Check if a badge is a completion badge based on its image URL.
 * Image URLs are identical across all users for the same badge type.
 */
export function isCompletionBadge(imageUrl: string | undefined): boolean {
  if (!imageUrl) return false;
  return COMPLETION_BADGE_IMAGE_URLS.has(imageUrl);
}

export function extractBadgeId(badgeUrl: string | undefined): string | null {
  if (!badgeUrl) return null;
  const match = badgeUrl.match(/\/badges\/(\d+)/);
  return match ? match[1] : null;
}

export const COMPLETION_BADGE_IDS = new Set<string>([]);
