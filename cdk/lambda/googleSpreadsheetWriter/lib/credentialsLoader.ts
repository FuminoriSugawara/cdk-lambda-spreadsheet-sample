import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

type GoogleApiCredentials = {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
};

type Secrets = {
  googleApiCredentials: string;
};

const getSecretsFromSecretsManager = async ({
  secretsManagerClient,
  secretArn,
}: {
  secretsManagerClient: SecretsManagerClient;
  secretArn: string;
}): Promise<Secrets> => {
  const secret = await secretsManagerClient.send(
    new GetSecretValueCommand({
      SecretId: secretArn,
    }),
  );

  if (typeof secret.SecretString !== 'string')
    throw new Error('SecretString is not a string');

  return JSON.parse(secret.SecretString);
};

export const getGoogleApiCredentials = async ({
  secretArn,
  secretsManagerClient,
}: {
  secretArn: string;
  secretsManagerClient: SecretsManagerClient;
}): Promise<GoogleApiCredentials> => {
  const secrets = await getSecretsFromSecretsManager({
    secretArn,
    secretsManagerClient,
  });
  const { googleApiCredentials } = secrets;

  if (!googleApiCredentials) {
    throw new Error('googleApiCredentials is required');
  }

  return JSON.parse(googleApiCredentials);
};
