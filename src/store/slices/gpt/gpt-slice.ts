// src/store/slices/gpt/gpt-slice.ts
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import { configFile } from "../../../utils/config";
import type { ApiResponse, InitialStateI, InputNode } from "../../../types";

const initialState: InitialStateI = {
  loading: false,
  data: null,
  error: false,
};

// Функция для генерации уникального ID
const generateNodeId = () =>
  `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const gptRequest = createAsyncThunk<ApiResponse, string>(
  "gptReducer/gptRequest",
  async (gptPromt, thunkAPI) => {
    try {
      const response = await axios.post(
        configFile.API_URL,
        {
          model: "gpt-4.1",
          input: `${configFile.API_LAYOUT}, вот сам промт - ${gptPromt}`,
          tools: [{ type: "web_search_preview" }],
        },
        {
          headers: {
            Authorization: `Bearer ${configFile.API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const textResponse = response.data.output[0].content[0].text;

      const extractAndParseJSON = (text: string) => {
        try {
          const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
          if (!jsonMatch || !jsonMatch[1]) {
            throw new Error("Не найден JSON блок в ответе");
          }

          let jsonString = jsonMatch[1];

          jsonString = jsonString
            .replace(/\/\/.*$/gm, "")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]")
            .trim();

          const parsedData = JSON.parse(jsonString);
          return parsedData;
        } catch (error) {
          throw new Error(`Не удалось обработать JSON из ответа: ${error}`);
        }
      };

      const jsonData = extractAndParseJSON(textResponse);
      return jsonData;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const gptReducer = createSlice({
  name: "gpt",
  initialState,
  reducers: {
    updateNode: (
      state,
      action: PayloadAction<{
        nodeId: string;
        updates: Partial<InputNode>;
      }>
    ) => {
      if (state.data?.nodes) {
        const nodeIndex = state.data.nodes.findIndex(
          (node) => node["Id узла"] === action.payload.nodeId
        );

        if (nodeIndex !== -1) {
          state.data.nodes[nodeIndex] = {
            ...state.data.nodes[nodeIndex],
            ...action.payload.updates,
          };
        }
      }
    },

    addNode: (
      state,
      action: PayloadAction<{
        nodeData: {
          type: "product" | "transformation";
          label: string;
          description?: string;
        };
        parentId?: string;
      }>
    ) => {
      if (state.data?.nodes) {
        const { nodeData, parentId } = action.payload;
        const newNodeId = generateNodeId();

        const newNode: InputNode = {
          "Id узла": newNodeId,
          Тип: nodeData.type === "product" ? "Продукт" : "Преобразование",
          Название: nodeData.label,
          Описание: nodeData.description || "",
          Входы: [],
          Выходы: [],
        };

        state.data.nodes.push(newNode);

        if (parentId) {
          const parentNode = state.data.nodes.find(
            (node) => node["Id узла"] === parentId
          );

          if (parentNode) {
            if (
              parentNode["Тип"]?.toLowerCase().includes("продукт") &&
              nodeData.type === "transformation"
            ) {
              if (!parentNode["Выходы"]) parentNode["Выходы"] = [];
              parentNode["Выходы"].push(newNodeId);

              if (!newNode["Входы"]) newNode["Входы"] = [];
              newNode["Входы"].push(parentId);
            } else if (
              parentNode["Тип"]?.toLowerCase().includes("преобразование") &&
              nodeData.type === "product"
            ) {
              if (!parentNode["Выходы"]) parentNode["Выходы"] = [];
              parentNode["Выходы"].push(newNodeId);

              if (!newNode["Входы"]) newNode["Входы"] = [];
              newNode["Входы"].push(parentId);
            }
          }
        }
      }
    },

    deleteNode: (state, action: PayloadAction<string>) => {
      if (state.data?.nodes) {
        state.data.nodes = state.data.nodes.filter(
          (node) => node["Id узла"] !== action.payload
        );

        state.data.nodes.forEach((node) => {
          if (node["Входы"] && Array.isArray(node["Входы"])) {
            node["Входы"] = node["Входы"].filter(
              (inputId) => inputId !== action.payload
            );
          }
          if (node["Выходы"] && Array.isArray(node["Выходы"])) {
            node["Выходы"] = node["Выходы"].filter(
              (outputId) => outputId !== action.payload
            );
          }
        });
      }
    },

    addConnection: (
      state,
      action: PayloadAction<{
        sourceId: string;
        targetId: string;
      }>
    ) => {
      if (state.data?.nodes) {
        const { sourceId, targetId } = action.payload;

        const sourceNode = state.data.nodes.find(
          (node) => node["Id узла"] === sourceId
        );
        if (
          sourceNode &&
          sourceNode["Тип"]?.toLowerCase().includes("преобразование")
        ) {
          if (!sourceNode["Выходы"]) {
            sourceNode["Выходы"] = [];
          }
          if (!sourceNode["Выходы"].includes(targetId)) {
            sourceNode["Выходы"].push(targetId);
          }
        }

        const targetNode = state.data.nodes.find(
          (node) => node["Id узла"] === targetId
        );
        if (targetNode) {
          if (!targetNode["Входы"]) {
            targetNode["Входы"] = [];
          }
          if (!targetNode["Входы"].includes(sourceId)) {
            targetNode["Входы"].push(sourceId);
          }
        }
      }
    },

    removeConnection: (
      state,
      action: PayloadAction<{
        sourceId: string;
        targetId: string;
      }>
    ) => {
      if (state.data?.nodes) {
        const { sourceId, targetId } = action.payload;

        const sourceNode = state.data.nodes.find(
          (node) => node["Id узла"] === sourceId
        );
        if (sourceNode && sourceNode["Выходы"]) {
          sourceNode["Выходы"] = sourceNode["Выходы"].filter(
            (id) => id !== targetId
          );
        }

        const targetNode = state.data.nodes.find(
          (node) => node["Id узла"] === targetId
        );
        if (targetNode && targetNode["Входы"]) {
          targetNode["Входы"] = targetNode["Входы"].filter(
            (id) => id !== sourceId
          );
        }
      }
    },

    resetToInitial: (state, action: PayloadAction<ApiResponse>) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(gptRequest.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(gptRequest.fulfilled, (state, action) => {
      state.data = action.payload;
      state.loading = false;
    });
    builder.addCase(gptRequest.rejected, (state) => {
      state.loading = false;
      state.error = true;
    });
  },
});

export const {
  updateNode,
  addNode,
  deleteNode,
  addConnection,
  removeConnection,
  resetToInitial,
} = gptReducer.actions;

export default gptReducer.reducer;
