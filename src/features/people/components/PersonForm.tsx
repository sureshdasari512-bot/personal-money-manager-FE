import { FormEvent, useState } from 'react';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import type { FieldErrors } from '../../../types/errors';
import type { PersonFormValues } from '../types';

interface PersonFormProps {
  initialValues?: PersonFormValues;
  isSaving: boolean;
  fieldErrors?: FieldErrors;
  globalError?: string | null;
  submitLabel?: string;
  onSubmit: (values: PersonFormValues) => Promise<void>;
}

/**
 * Presentational contact form. Parent owns persistence and API errors.
 *
 * @param initialValues - Values when editing
 * @param isSaving - Disables submit while the request is in flight
 * @param fieldErrors - Per-field messages from the API
 * @param globalError - Form-level message from the API
 * @param submitLabel - Primary button text
 * @param onSubmit - Persist handler from the parent container
 */
export function PersonForm({
  initialValues,
  isSaving,
  fieldErrors = {},
  globalError,
  submitLabel = 'Save person',
  onSubmit,
}: PersonFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [phone, setPhone] = useState(initialValues?.phone ?? '');
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [nameError, setNameError] = useState<string | undefined>();

  /**
   * Validates required fields and forwards a clean payload.
   *
   * @param event - Form submit event
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError(undefined);
    await onSubmit({
      name: name.trim(),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FormError message={globalError} />
      <Input
        label="Name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={nameError ?? fieldErrors.name}
        required
      />
      <Input
        label="Phone"
        name="phone"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        error={fieldErrors.phone}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
      />
      <Input
        label="Notes"
        name="notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        error={fieldErrors.notes}
      />
      <Button type="submit" isLoading={isSaving}>
        {submitLabel}
      </Button>
    </form>
  );
}
