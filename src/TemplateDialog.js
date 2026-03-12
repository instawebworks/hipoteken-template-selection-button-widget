/* global ZOHO */
import { useState, useEffect } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

const FILE_TYPE_OPTIONS = ["PDF", "PNG", "JPG", "JPEG"];
const REQUIREMENT_OPTIONS = ["Required", "Optional"];

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 10 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
}

export default function TemplateDialog({ open, onClose, template, entity, recordData }) {
  const [topData, setTopData] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!template?.Template_JSON) return;

    // If the record already has a customized JSON and the Portal_URL points to
    // this same template, use the record's version — otherwise use the template's.
    const urlTemplateId = recordData?.Portal_URL?.split("/")[3];
    const useRecordJSON =
      recordData?.Additional_Template_JSON && urlTemplateId === template.id;
    const jsonToParse = useRecordJSON
      ? recordData.Additional_Template_JSON
      : template.Template_JSON;

    try {
      const parsed = JSON.parse(jsonToParse);
      setTopData(parsed);
      setRequirements(parsed.documentRequirements || []);
    } catch {
      setTopData(null);
      setRequirements([]);
    }
  }, [template, recordData]);

  const updateRequirement = (id, field, value) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const removeRequirement = (id) => {
    setRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const addRequirement = () => {
    setRequirements((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        checked: true,
        uploadCount: 1,
        requirement: "Required",
        additionalInstructions: "",
        fileTypes: [],
      },
    ]);
  };

  const handleSave = () => {
    if (!template || !topData || !entity) return;
    setSaving(true);

    const updatedJSON = JSON.stringify({
      ...topData,
      documentRequirements: requirements,
    });
    const password = recordData?.Portal_Password || generatePassword();
    const url = `https://home-espana-client-portal-nextjs-ap.vercel.app/${template.id}/${entity.moduleName}/${entity.recordId}`;

    ZOHO.CRM.API.updateRecord({
      Entity: entity.moduleName,
      APIData: {
        id: entity.recordId?.[0],
        Portal_Password: password,
        Portal_URL: url,
        Additional_Template_JSON: updatedJSON,
      },
    })
      .then(() => {
        setSaving(false);
        ZOHO.CRM.UI.Popup.closeReload();
      })
      .catch(() => setSaving(false));
  };

  if (!template || !topData) return null;

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
        Edit Checklist Template
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {/* Top section — disabled */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            p: 2,
          }}
        >
          <TextField
            label="Template Name"
            value={topData.templateName || ""}
            disabled
            fullWidth
            size="small"
          />
          <TextField
            label="Module Name"
            value={topData.moduleName?.label || ""}
            disabled
            fullWidth
            size="small"
          />
          <TextField
            label="Password Field"
            value={topData.passwordField?.label || ""}
            disabled
            fullWidth
            size="small"
          />
          <TextField
            label="Workdrive Folder ID Field"
            value={topData.workdriveFolder?.label || ""}
            disabled
            fullWidth
            size="small"
          />
        </Box>

        {/* Document Requirements */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            Document Requirements
          </Typography>

          <Box display="flex" flexDirection="column" gap={1.5}>
            {requirements.map((req) => (
              <Box
                key={req.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.5,
                }}
              >
                {/* Name row */}
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Checkbox
                    checked={req.checked}
                    onChange={(e) =>
                      updateRequirement(req.id, "checked", e.target.checked)
                    }
                    size="small"
                    sx={{ p: 0.5 }}
                  />
                  <TextField
                    value={req.name}
                    onChange={(e) =>
                      updateRequirement(req.id, "name", e.target.value)
                    }
                    placeholder="Requirement name"
                    variant="standard"
                    size="small"
                    inputProps={{
                      style: { fontWeight: 600, fontSize: "0.875rem" },
                    }}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeRequirement(req.id)}
                    sx={{ color: "error.main", ml: "auto" }}
                  >
                    ✕
                  </IconButton>
                </Box>

                {/* File types + upload count + requirement */}
                <Box display="flex" gap={1.5} alignItems="flex-start" mb={1}>
                  <Autocomplete
                    multiple
                    options={FILE_TYPE_OPTIONS}
                    value={req.fileTypes}
                    onChange={(_, value) =>
                      updateRequirement(req.id, "fileTypes", value)
                    }
                    freeSolo
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            size="small"
                            {...tagProps}
                            sx={{ fontSize: "0.7rem", height: 22 }}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="File types"
                      />
                    )}
                    sx={{ flex: 1 }}
                    size="small"
                  />
                  <TextField
                    label="Upload Count"
                    type="number"
                    value={req.uploadCount}
                    onChange={(e) =>
                      updateRequirement(
                        req.id,
                        "uploadCount",
                        Number(e.target.value),
                      )
                    }
                    size="small"
                    inputProps={{ min: 1 }}
                    sx={{ width: 120 }}
                  />
                  <FormControl size="small" sx={{ width: 140 }}>
                    <InputLabel>Requirement</InputLabel>
                    <Select
                      value={req.requirement}
                      label="Requirement"
                      onChange={(e) =>
                        updateRequirement(req.id, "requirement", e.target.value)
                      }
                    >
                      {REQUIREMENT_OPTIONS.map((opt) => (
                        <MenuItem
                          key={opt}
                          value={opt}
                          sx={{ fontSize: "0.8rem" }}
                        >
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Additional instructions */}
                <TextField
                  value={req.additionalInstructions}
                  onChange={(e) =>
                    updateRequirement(
                      req.id,
                      "additionalInstructions",
                      e.target.value,
                    )
                  }
                  placeholder="Additional instructions"
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                />
              </Box>
            ))}

            <Button
              variant="outlined"
              onClick={addRequirement}
              fullWidth
              sx={{
                borderStyle: "dashed",
                fontSize: "0.75rem",
                color: "text.secondary",
                borderColor: "divider",
              }}
            >
              + Add Field
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button size="small" variant="outlined" onClick={() => onClose(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Updated Info"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
