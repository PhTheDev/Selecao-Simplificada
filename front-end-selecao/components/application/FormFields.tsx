'use client';

import { AlertCircle, CheckCircle, Upload, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface InputFieldProps {
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    required?: boolean;
    children?: React.ReactNode;
}

export const InputField = ({
    label,
    name,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    required = false,
    children,
}: InputFieldProps) => (
    <motion.div
        className="space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
    >
        <label className="block text-sm font-medium text-foreground/80">
            {label} {required && <span className="text-destructive">*</span>}
        </label>
        {children || (
            <motion.input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                    error
                        ? 'border-destructive/30 focus:ring-destructive bg-destructive-soft'
                        : 'border-input focus:ring-primary-hover focus:border-primary-hover hover:border-input'
                }`}
                whileFocus={{ scale: 1.01 }}
            />
        )}
        {error && (
            <motion.p
                className="text-sm text-destructive flex items-center gap-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <AlertCircle className="w-4 h-4" /> {error}
            </motion.p>
        )}
    </motion.div>
);

interface SelectFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{ value: string; label: string }>;
    error?: string;
    required?: boolean;
}

export const SelectField = ({
    label,
    name,
    value,
    onChange,
    options,
    error,
    required = false,
}: SelectFieldProps) => (
    <motion.div
        className="space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
    >
        <label className="block text-sm font-medium text-foreground/80">
            {label} {required && <span className="text-destructive">*</span>}
        </label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                error
                    ? 'border-destructive/30 focus:ring-destructive bg-destructive-soft'
                    : 'border-input focus:ring-primary-hover focus:border-primary-hover hover:border-input'
            }`}
        >
            <option value="">Selecione...</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        {error && (
            <motion.p
                className="text-sm text-destructive flex items-center gap-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <AlertCircle className="w-4 h-4" /> {error}
            </motion.p>
        )}
    </motion.div>
);

interface FileUploadFieldProps {
    label: string;
    name: string;
    description: string;
    file: File | null;
    preview?: string;
    error?: string;
    required?: boolean;
    accept?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}

export const FileUploadField = ({
    label,
    name,
    description,
    file,
    preview,
    error,
    required = false,
    accept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx',
    onChange,
    onRemove,
}: FileUploadFieldProps) => (
    <motion.div
        className="space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
    >
        <label className="block text-sm font-medium text-foreground/80">
            {label} {required && <span className="text-destructive">*</span>}
        </label>
        <p className="text-sm text-muted-foreground">{description}</p>
        <motion.div
            className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                error
                    ? 'border-destructive/30 bg-destructive-soft'
                    : file
                      ? 'border-primary-hover bg-primary-soft'
                      : 'border-input hover:border-input'
            }`}
            whileHover={{ scale: 1.005 }}
        >
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <input
                        type="file"
                        onChange={onChange}
                        accept={accept}
                        className="hidden"
                        id={`file-${name}`}
                    />
                    <motion.label
                        htmlFor={`file-${name}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-input rounded-lg hover:bg-background cursor-pointer transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">Selecionar arquivo</span>
                    </motion.label>
                </div>
                {preview && (
                    <motion.div
                        className="w-16 h-16 rounded-lg overflow-hidden border"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    </motion.div>
                )}
            </div>
            {file && (
                <motion.div
                    className="mt-3 flex items-center justify-between"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary-hover" />
                        <span className="text-sm font-medium text-foreground/80">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                    </div>
                    <motion.button
                        type="button"
                        onClick={onRemove}
                        className="text-destructive hover:text-destructive"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <XCircle className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            )}
        </motion.div>
        {error && (
            <motion.p
                className="text-sm text-destructive flex items-center gap-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <AlertCircle className="w-4 h-4" /> {error}
            </motion.p>
        )}
    </motion.div>
);

