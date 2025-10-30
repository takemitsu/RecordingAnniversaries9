interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "textarea" | "date";
  defaultValue?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

export function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  error,
  required = false,
  placeholder,
  rows = 4,
}: FormFieldProps) {
  const inputClasses =
    "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm focus:border-sky-500 focus:ring-sky-500";
  const errorClasses = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "";

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={rows}
          className={`${inputClasses} ${errorClasses}`}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          defaultValue={defaultValue}
          className={`${inputClasses} ${errorClasses}`}
          placeholder={placeholder}
          required={required}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
