import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dream } from '../../services/dreamService';

interface DreamEntryProps extends Dream {
  onDelete: (id: string) => void;
}

const DreamEntry: React.FC<DreamEntryProps> = ({
  id,
  text,
  createdAt,
  public: isPublic,
  onDelete,
}) => {
  const formattedDate = format(new Date(createdAt), 'MMM d, yyyy h:mm a');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group"
    >
      <Card className="h-full transition-colors hover:border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {formattedDate}
            </CardTitle>
            {isPublic && <Badge variant="secondary">Public</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-4">
            {text}
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Delete
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default DreamEntry; 