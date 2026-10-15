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
        <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
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
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-[#0a9396] focus:border-[#0a9396] hover:border-gray-400'
                }`}
                whileFocus={{ scale: 1.01 }}
            />
        )}
        {error && (
            <motion.p
                className="text-sm text-red-600 flex items-center gap-1"
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
        <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                error
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-[#0a9396] focus:border-[#0a9396] hover:border-gray-400'
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
                className="text-sm text-red-600 flex items-center gap-1"
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
        <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <p className="text-sm text-gray-500">{description}</p>
        <motion.div
            className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                error
                    ? 'border-red-300 bg-red-50'
                    : file
                      ? 'border-[#0a9396] bg-[#e6f7f9]'
                      : 'border-gray-300 hover:border-gray-400'
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
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                        <CheckCircle className="w-4 h-4 text-[#0a9396]" />
                        <span className="text-sm font-medium text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                    </div>
                    <motion.button
                        type="button"
                        onClick={onRemove}
                        className="text-red-500 hover:text-red-700"
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
                className="text-sm text-red-600 flex items-center gap-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <AlertCircle className="w-4 h-4" /> {error}
            </motion.p>
        )}
    </motion.div>
);

