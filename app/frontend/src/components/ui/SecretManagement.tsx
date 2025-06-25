import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { SERVER_URL } from '@/config';

interface SecretManagementProps {
  agentId: string;
  requiredSecrets: string[];
  optionalSecrets: string[];
  title?: string;
  onSecretsChange?: (secrets: string[]) => void;
}

export default function SecretManagement({
  agentId,
  requiredSecrets,
  optionalSecrets,
  title = 'Secrets',
  onSecretsChange,
}: SecretManagementProps) {
  const [secrets, setSecrets] = useState<string[]>([]);
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>(
    {},
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    secretKey: string;
    isRequired: boolean;
  }>({ show: false, secretKey: '', isRequired: false });

  // Load secrets
  useEffect(() => {
    if (!agentId) return;

    const loadSecrets = async () => {
      try {
        const secretsResponse = await fetch(
          `${SERVER_URL}/api/secrets?userId=${agentId}`,
        );
        if (secretsResponse.ok) {
          const secretsData = await secretsResponse.json();
          const secretsList = secretsData.secrets || [];
          setSecrets(secretsList);
          onSecretsChange?.(secretsList);
        }
      } catch (error) {
        console.error('Error loading secrets:', error);
      }
    };

    loadSecrets();
  }, []);

  const handleSecretChange = (secretKey: string, value: string) => {
    setSecretValues((prev) => ({ ...prev, [secretKey]: value }));
  };

  const handleSaveSecret = async (secretKey: string) => {
    if (!agentId) return;

    const value = secretValues[secretKey];
    if (!value) {
      toast.error('Secret value cannot be empty');
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: agentId, key: secretKey, value }),
      });

      if (!response.ok) throw new Error('Failed to save secret');

      // Clear the input and refresh secrets
      setSecretValues((prev) => ({ ...prev, [secretKey]: '' }));

      // Refresh secrets
      const secretsResponse = await fetch(
        `${SERVER_URL}/api/secrets?userId=${agentId}`,
      );
      if (secretsResponse.ok) {
        const secretsData = await secretsResponse.json();
        const secretsList = secretsData.secrets || [];
        setSecrets(secretsList);
        onSecretsChange?.(secretsList);
      }

      toast.success(`${secretKey} saved successfully`);
    } catch (error) {
      toast.error(`Failed to save ${secretKey}`);
    }
  };

  const handleDeleteSecretClick = (secretKey: string) => {
    const isRequired = requiredSecrets.includes(secretKey);
    setDeleteConfirm({
      show: true,
      secretKey,
      isRequired,
    });
  };

  const handleDeleteSecret = async () => {
    const { secretKey } = deleteConfirm;
    if (!agentId) return;

    try {
      const response = await fetch(`${SERVER_URL}/api/secrets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: agentId, key: secretKey }),
      });

      if (!response.ok) throw new Error('Failed to delete secret');

      // Refresh secrets
      const secretsResponse = await fetch(
        `${SERVER_URL}/api/secrets?userId=${agentId}`,
      );
      if (secretsResponse.ok) {
        const secretsData = await secretsResponse.json();
        const secretsList = secretsData.secrets || [];
        setSecrets(secretsList);
        onSecretsChange?.(secretsList);
      }

      toast.success(`${secretKey} deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete ${secretKey}`);
    } finally {
      setDeleteConfirm({ show: false, secretKey: '', isRequired: false });
    }
  };

  const toggleSecretVisibility = (secretKey: string) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [secretKey]: !prev[secretKey],
    }));
  };

  const isBooleanSetting = (secretKey: string) => {
    return secretKey.includes('RESPOND_TO_') || secretKey.includes('_ENABLED');
  };

  const formatSecretLabel = (secretKey: string) => {
    return secretKey
      .replace(/^(TELEGRAM_|SCHEDULE_|CRYPTO_)/, '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderSecretField = (secretKey: string, isRequired: boolean) => {
    const isSet = secrets.includes(secretKey);
    const currentValue = secretValues[secretKey] || '';
    const isVisible = visibleSecrets[secretKey] || false;
    const isBool = isBooleanSetting(secretKey);

    return (
      <div key={secretKey} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={secretKey} className="flex items-center gap-2">
            {formatSecretLabel(secretKey)}
            {isRequired && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
            {!isRequired && (
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            )}
            {isSet && (
              <Badge variant="default" className="text-xs">
                Set
              </Badge>
            )}
            {isBool && (
              <Badge variant="outline" className="text-xs">
                Boolean
              </Badge>
            )}
          </Label>
          {isSet && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteSecretClick(secretKey)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            {isBool ? (
              <select
                id={secretKey}
                name={secretKey}
                value={currentValue}
                onChange={(e) => handleSecretChange(secretKey, e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select value...</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <Input
                id={secretKey}
                name={secretKey}
                type={isVisible ? 'text' : 'password'}
                placeholder={
                  isSet
                    ? 'Secret is set'
                    : `Enter ${formatSecretLabel(secretKey)}`
                }
                value={currentValue}
                onChange={(e) => handleSecretChange(secretKey, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentValue.trim()) {
                    e.preventDefault();
                    handleSaveSecret(secretKey);
                  }
                }}
                className={isSet ? 'border-green-500' : ''}
                autoComplete="off"
              />
            )}
            {!isBool && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleSecretVisibility(secretKey)}
                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
              >
                {isVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <Button
            type="button"
            onClick={() => handleSaveSecret(secretKey)}
            disabled={!currentValue.trim()}
            size="sm"
          >
            {isSet ? 'Update' : 'Set'}
          </Button>
        </div>
        {isBool && (
          <p className="text-xs text-muted-foreground">
            Controls whether the bot responds to{' '}
            {secretKey
              .replace(/^.*RESPOND_TO_/, '')
              .toLowerCase()
              .replace('_', ' ')}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Secrets */}
          {requiredSecrets.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Required Secrets
              </h4>
              {requiredSecrets.map((secretKey) =>
                renderSecretField(secretKey, true),
              )}
            </div>
          )}

          {/* Optional Secrets */}
          {optionalSecrets.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Optional Secrets
              </h4>
              {optionalSecrets.map((secretKey) =>
                renderSecretField(secretKey, false),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Secret Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.show}
        onConfirm={handleDeleteSecret}
        onCancel={() =>
          setDeleteConfirm({ show: false, secretKey: '', isRequired: false })
        }
        title="Delete Secret"
        message={
          deleteConfirm.isRequired
            ? `Are you sure you want to delete ${deleteConfirm.secretKey}? This is a required secret and may disable functionality.`
            : `Are you sure you want to delete ${deleteConfirm.secretKey}?`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        futureStatus={deleteConfirm.isRequired ? 'disabled' : null}
      />
    </>
  );
}
