import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useSecrets } from '@/hooks/useSecrets.ts';

interface SecretManagementProps {
  userId: string | undefined;
  title?: string;
  description?: string;
}

export default function SecretManagement({
  userId,
  title = 'Secret Management',
  description = 'Manage encrypted secrets for your triggers. Secrets are stored encrypted and never displayed in plain text.',
}: SecretManagementProps) {
  const { secretKeys, loading, setSecret, deleteSecret } = useSecrets(userId);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSecret = async () => {
    if (!newSecretKey.trim() || !newSecretValue.trim()) {
      toast.error('Both key and value are required');
      return;
    }

    if (secretKeys.includes(newSecretKey)) {
      toast.error('Secret key already exists');
      return;
    }

    setIsAdding(true);
    const success = await setSecret(newSecretKey, newSecretValue);

    if (success) {
      toast.success('Secret added successfully');
      setNewSecretKey('');
      setNewSecretValue('');
      setShowValue(false);
    } else {
      toast.error('Failed to add secret');
    }
    setIsAdding(false);
  };

  const handleDeleteSecret = async (key: string) => {
    const success = await deleteSecret(key);

    if (success) {
      toast.success('Secret deleted successfully');
    } else {
      toast.error('Failed to delete secret');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Secrets */}
        {secretKeys.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Existing Secrets</Label>
            <div className="flex flex-wrap gap-2">
              {secretKeys.map((key) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  <span>{key}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => handleDeleteSecret(key)}
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add New Secret */}
        <div className="space-y-3 pt-2 border-t">
          <Label className="text-sm font-medium">Add New Secret</Label>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="secret-key">Secret Key</Label>
                <Input
                  id="secret-key"
                  name="secret-key"
                  placeholder="e.g., TELEGRAM_BOT_TOKEN"
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      newSecretKey.trim() &&
                      newSecretValue.trim()
                    ) {
                      e.preventDefault();
                      handleAddSecret();
                    }
                  }}
                  disabled={loading || isAdding}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret-value">Secret Value</Label>
                <div className="relative">
                  <Input
                    id="secret-value"
                    name="secret-value"
                    type={showValue ? 'text' : 'password'}
                    placeholder="Enter secret value..."
                    value={newSecretValue}
                    onChange={(e) => setNewSecretValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        newSecretKey.trim() &&
                        newSecretValue.trim()
                      ) {
                        e.preventDefault();
                        handleAddSecret();
                      }
                    }}
                    disabled={loading || isAdding}
                    className="pr-10"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowValue(!showValue)}
                    disabled={loading || isAdding}
                  >
                    {showValue ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddSecret}
              disabled={
                loading ||
                isAdding ||
                !newSecretKey.trim() ||
                !newSecretValue.trim()
              }
              className="w-full md:w-auto"
            >
              {isAdding ? (
                'Adding...'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Secret
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Common Secret Examples */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p className="font-medium mb-1">Common secret keys:</p>
          <div className="flex flex-wrap gap-1">
            {['TELEGRAM_BOT_TOKEN', 'OPENAI_API_KEY', 'DISCORD_TOKEN'].map(
              (example) => (
                <Badge
                  key={example}
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={() => setNewSecretKey(example)}
                >
                  {example}
                </Badge>
              ),
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
