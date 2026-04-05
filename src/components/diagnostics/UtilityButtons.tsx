import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Download, FileDown, FilePlus, Trash2 } from 'lucide-react';

interface TestButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

const TestButton: React.FC<TestButtonProps> = ({ 
  label, 
  onClick, 
  icon, 
  variant = 'secondary' 
}) => {
  const baseStyles = "flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm";
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]}`}
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
};

interface UtilityButtonsProps {
  onExportData: () => void;
  onClearLogs: () => void;
  onInjectTestError: (errorType: string) => void;
}

const UtilityButtons: React.FC<UtilityButtonsProps> = ({
  onExportData,
  onClearLogs,
  onInjectTestError
}) => {
  const [showTestButtons, setShowTestButtons] = React.useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FilePlus className="w-5 h-5 mr-2 text-indigo-600" />
        Diagnostic Tools
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 border-b pb-6">
          <h3 className="text-md font-medium mb-3">Data Management</h3>
          <div className="flex flex-wrap gap-3">
            <TestButton
              label="Export Diagnostic Data"
              onClick={onExportData}
              icon={<Download className="w-4 h-4" />}
              variant="primary"
            />
            <TestButton
              label="Clear All Logs"
              onClick={onClearLogs}
              icon={<Trash2 className="w-4 h-4" />}
              variant="danger"
            />
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium">Error Testing</h3>
            <button 
              onClick={() => setShowTestButtons(!showTestButtons)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showTestButtons ? 'Hide Tests' : 'Show Tests'}
            </button>
          </div>
          
          {showTestButtons && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <p className="text-xs text-gray-500 mb-2">
                Use these buttons to test error handling. They will deliberately cause errors.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <TestButton
                  label="JavaScript Error"
                  onClick={() => onInjectTestError('reference')}
                  variant="secondary"
                />
                <TestButton
                  label="Type Error"
                  onClick={() => onInjectTestError('type')}
                  variant="secondary"
                />
                <TestButton
                  label="Syntax Error"
                  onClick={() => onInjectTestError('syntax')}
                  variant="secondary"
                />
                <TestButton
                  label="API Error"
                  onClick={() => onInjectTestError('api')}
                  variant="secondary"
                />
                <TestButton
                  label="Promise Error"
                  onClick={() => onInjectTestError('promise')}
                  variant="secondary"
                />
                <TestButton
                  label="Custom Error"
                  onClick={() => onInjectTestError('custom')}
                  variant="secondary"
                />
              </div>
              
              <div className="mt-3 bg-amber-50 p-3 rounded text-xs text-amber-800">
                <p className="flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Warning: These buttons will cause real errors that will appear in the logs.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UtilityButtons;
