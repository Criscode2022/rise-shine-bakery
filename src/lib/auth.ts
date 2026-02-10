import { createAuthClient } from '@neondatabase/neon-js/auth';
import { environment } from '../environments/environment';

export const authClient = createAuthClient(environment.neonAuthUrl);
