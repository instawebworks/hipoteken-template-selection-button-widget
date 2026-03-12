/* global ZOHO */
import { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Chip,
} from "@mui/material";
import TemplateDialog from "./TemplateDialog";

function App() {
  const [entity, setEntity] = useState(null);
  const [recordData, setRecordData] = useState(null); // eslint-disable-line no-unused-vars
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad", function (data) {
      ZOHO.CRM.UI.Resize({ height: "80%", width: "60%" });
      const { Entity, EntityId } = data;
      setEntity({ moduleName: Entity, recordId: EntityId });

      const fetchRecord = ZOHO.CRM.API.getRecord({
        Entity,
        RecordID: EntityId,
      });
      const fetchTemplates = ZOHO.CRM.API.searchRecord({
        Entity: "Document_Templates",
        Type: "criteria",
        Query: `(Module_Name:equals:${Entity})`,
      });

      Promise.all([fetchRecord, fetchTemplates])
        .then(([recordResponse, templatesResponse]) => {
          if (recordResponse.data && recordResponse.data.length > 0) {
            setRecordData(recordResponse.data[0]);
          }
          if (templatesResponse.data && templatesResponse.data.length > 0) {
            setTemplates(templatesResponse.data);
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load data.");
          setLoading(false);
        });
    });

    ZOHO.embeddedApp.init();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const handleRowClick = (template) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const headerCellSx = {
    backgroundColor: "#2c6da4",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.75rem",
    py: 1,
    whiteSpace: "nowrap",
  };

  const bodyCellSx = {
    fontSize: "0.75rem",
    py: 0.75,
  };

  return (
    <Box p={1.5} display="flex" flexDirection="column" gap={1.5}>
      <Typography variant="subtitle1" fontWeight={600}>
        {entity?.moduleName} — Template Selection
      </Typography>

      {templates.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No templates found for this module.
        </Typography>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 1 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Name</TableCell>
                <TableCell sx={headerCellSx}>Module</TableCell>
                <TableCell sx={headerCellSx}>Status</TableCell>
                <TableCell sx={headerCellSx}>Last Modified</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => {
                return (
                  <TableRow
                    key={template.id}
                    hover
                    onClick={() => handleRowClick(template)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ ...bodyCellSx, fontWeight: 700 }}>
                      {template.Name}
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      {template.Module_Name}
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      <Chip
                        label={template.Template_Status}
                        size="small"
                        color={
                          template.Template_Status === "Active"
                            ? "success"
                            : "default"
                        }
                        sx={{ fontSize: "0.7rem", height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      {new Date(template.Modified_Time).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TemplateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        template={selectedTemplate}
        entity={entity}
        recordData={recordData}
      />
    </Box>
  );
}

export default App;
