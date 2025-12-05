import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createDb, users, tenants, eq } from '@qualyit/database';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response('Error: Missing webhook secret', { status: 500 });
  }

  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  const db = createDb(process.env.DATABASE_URL!);

  // Handle the webhook
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created': {
        // User created - this happens when admin creates a user
        // The user will be linked to a tenant based on organization membership
        console.log('User created:', evt.data.id);
        break;
      }

      case 'user.updated': {
        // Update user in our database
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(' ') || email;

        await db
          .update(users)
          .set({
            email: email || '',
            name,
            avatarUrl: image_url,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkUserId, id));

        console.log('User updated:', id);
        break;
      }

      case 'user.deleted': {
        // Soft delete user (set is_active = false)
        const { id } = evt.data;
        if (id) {
          await db
            .update(users)
            .set({
              isActive: false,
              updatedAt: new Date(),
            })
            .where(eq(users.clerkUserId, id));
        }
        console.log('User deleted:', id);
        break;
      }

      case 'organization.created': {
        // Organization created - create tenant
        const { id, name, slug } = evt.data;

        await db.insert(tenants).values({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          subdomain: slug || name.toLowerCase().replace(/\s+/g, '-'),
          clerkOrgId: id,
        });

        console.log('Tenant created for organization:', id);
        break;
      }

      case 'organization.updated': {
        // Update tenant
        const { id, name, slug } = evt.data;

        await db
          .update(tenants)
          .set({
            name,
            slug: slug || undefined,
            updatedAt: new Date(),
          })
          .where(eq(tenants.clerkOrgId, id));

        console.log('Tenant updated:', id);
        break;
      }

      case 'organizationMembership.created': {
        // User added to organization
        const { organization, public_user_data } = evt.data;

        // Find the tenant
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.clerkOrgId, organization.id),
        });

        if (tenant && public_user_data.user_id) {
          // Check if user already exists
          const existingUser = await db.query.users.findFirst({
            where: eq(users.clerkUserId, public_user_data.user_id),
          });

          if (!existingUser) {
            // Create user in our database
            await db.insert(users).values({
              tenantId: tenant.id,
              clerkUserId: public_user_data.user_id,
              email: public_user_data.identifier || '',
              name: public_user_data.identifier?.split('@')[0] || 'Usuario',
              avatarUrl: public_user_data.image_url,
              role: 'employee',
            });
          }
        }

        console.log('User added to organization:', organization.id);
        break;
      }

      case 'organizationMembership.deleted': {
        // User removed from organization - deactivate
        const { organization, public_user_data } = evt.data;

        if (public_user_data.user_id) {
          // Find tenant
          const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.clerkOrgId, organization.id),
          });

          if (tenant) {
            // Deactivate user for this tenant
            await db
              .update(users)
              .set({ isActive: false, updatedAt: new Date() })
              .where(eq(users.clerkUserId, public_user_data.user_id));
          }
        }

        console.log('User removed from organization:', organization.id);
        break;
      }

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}
