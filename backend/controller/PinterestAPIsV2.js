const axios = require('axios');

const pinterestController = {

  /**
   * Get Pinterest API configuration
   */
  getConfig: () => {
    const isProduction =
      String(process.env.PINTEREST_PRODUCTION_MODE).toLowerCase() === 'true';

    const baseURL = isProduction
      ? 'https://api.pinterest.com/v5'
      : 'https://api-sandbox.pinterest.com/v5';

    const accessToken = process.env.PINTEREST_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('PINTEREST_ACCESS_TOKEN is not configured.');
    }

    return {
      baseURL,
      accessToken,
      isProduction
    };
  },


  /**
   * Make authenticated Pinterest API request
   */
  pinterestRequest: async ({
    method,
    endpoint,
    data = undefined,
    params = undefined
  }) => {

    const {
      baseURL,
      accessToken
    } = pinterestController.getConfig();

    const response = await axios({
      method,
      url: `${baseURL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data,
      params
    });

    return response.data;
  },


  // ============================================================
  // USER ACCOUNT
  // ============================================================

  /**
   * GET /user_account
   *
   * Get authenticated Pinterest account
   */
  getUserAccount: async (req, res) => {
    try {

      const data = await pinterestController.pinterestRequest({
        method: 'GET',
        endpoint: '/user_account'
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest user account fetched successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest getUserAccount error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch Pinterest user account.'
      );
    }
  },


  // ============================================================
  // BOARDS
  // ============================================================

  /**
   * GET /boards
   *
   * Get all boards
   */
  getBoards: async (req, res) => {
    try {

      const {
        page_size,
        bookmark
      } = req.query;

      const params = {};

      if (page_size) {
        params.page_size = page_size;
      }

      if (bookmark) {
        params.bookmark = bookmark;
      }

      const data = await pinterestController.pinterestRequest({
        method: 'GET',
        endpoint: '/boards',
        params
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest boards fetched successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest getBoards error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch Pinterest boards.'
      );
    }
  },


  /**
   * GET /boards/:boardId
   *
   * Get single board
   */
  getBoard: async (req, res) => {
    try {

      const { boardId } = req.params;

      if (!boardId) {
        return helper.sendError(
          res,
          400,
          'Board ID is required.'
        );
      }

      const data = await pinterestController.pinterestRequest({
        method: 'GET',
        endpoint: `/boards/${boardId}`
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest board fetched successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest getBoard error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch Pinterest board.'
      );
    }
  },


  /**
   * POST /boards
   *
   * Create board
   */
  createBoard: async (req, res) => {
    try {

      const {
        name,
        description,
        privacy
      } = req.body;

      if (!name || !String(name).trim()) {
        return helper.sendError(
          res,
          400,
          'Board name is required.'
        );
      }

      const payload = {
        name: String(name).trim()
      };

      if (description !== undefined) {
        payload.description = description;
      }

      if (privacy !== undefined) {
        payload.privacy = privacy;
      }

      const data = await pinterestController.pinterestRequest({
        method: 'POST',
        endpoint: '/boards',
        data: payload
      });

      return helper.sendSuccess(
        res,
        201,
        'Pinterest board created successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest createBoard error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to create Pinterest board.'
      );
    }
  },


  /**
   * PATCH /boards/:boardId
   *
   * Update board
   */
  updateBoard: async (req, res) => {
    try {

      const { boardId } = req.params;

      if (!boardId) {
        return helper.sendError(
          res,
          400,
          'Board ID is required.'
        );
      }

      const {
        name,
        description,
        privacy
      } = req.body;

      const payload = {};

      if (name !== undefined) {
        payload.name = name;
      }

      if (description !== undefined) {
        payload.description = description;
      }

      if (privacy !== undefined) {
        payload.privacy = privacy;
      }

      if (Object.keys(payload).length === 0) {
        return helper.sendError(
          res,
          400,
          'At least one board field is required to update.'
        );
      }

      const data = await pinterestController.pinterestRequest({
        method: 'PATCH',
        endpoint: `/boards/${boardId}`,
        data: payload
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest board updated successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest updateBoard error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to update Pinterest board.'
      );
    }
  },


  /**
   * DELETE /boards/:boardId
   *
   * Delete board
   */
  deleteBoard: async (req, res) => {
    try {

      const { boardId } = req.params;

      if (!boardId) {
        return helper.sendError(
          res,
          400,
          'Board ID is required.'
        );
      }

      await pinterestController.pinterestRequest({
        method: 'DELETE',
        endpoint: `/boards/${boardId}`
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest board deleted successfully.',
        {
          boardId
        }
      );

    } catch (error) {

      console.error(
        'Pinterest deleteBoard error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to delete Pinterest board.'
      );
    }
  },


  /**
   * GET /boards/:boardId/pins
   *
   * Get pins belonging to a board
   */
  getBoardPins: async (req, res) => {
    try {

      const { boardId } = req.params;

      if (!boardId) {
        return helper.sendError(
          res,
          400,
          'Board ID is required.'
        );
      }

      const {
        page_size,
        bookmark
      } = req.query;

      const params = {};

      if (page_size) {
        params.page_size = page_size;
      }

      if (bookmark) {
        params.bookmark = bookmark;
      }

      const data = await pinterestController.pinterestRequest({
        method: 'GET',
        endpoint: `/boards/${boardId}/pins`,
        params
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest board pins fetched successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest getBoardPins error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch Pinterest board pins.'
      );
    }
  },


  // ============================================================
  // PINS
  // ============================================================

  /**
   * GET /pins
   *
   * Get all Pins
   */
  getPins: async (req, res) => {
    try {

      const {
        bookmark,
        page_size,
        pin_filter
      } = req.query;

      const params = {};

      if (bookmark) {
        params.bookmark = bookmark;
      }

      if (page_size) {
        params.page_size = page_size;
      }

      if (pin_filter) {
        params.pin_filter = pin_filter;
      }

      const data = await pinterestController.pinterestRequest({
        method: 'GET',
        endpoint: '/pins',
        params
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest pins fetched successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest getPins error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch Pinterest pins.'
      );
    }
  },


  /**
   * GET /pins/:pinId
   *
   * Get single Pin
   */
  getPin: async (req, res) => {
    try {

      const { pinId } = req.params;

      if (!pinId) {
        return helper.sendError(
          res,
          400,
          'Pin ID is required.'
        );
      }

      const data = await pinterestController.pinterestRequest({
        method: 'GET',
        endpoint: `/pins/${pinId}`
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest pin fetched successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest getPin error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch Pinterest pin.'
      );
    }
  },


  /**
   * POST /pins
   *
   * Create Pin
   */
  createPin: async (req, res) => {
    try {

      const {
        board_id,
        board_section_id,
        title,
        description,
        link,
        alt_text,
        media_source
      } = req.body;

      if (!board_id) {
        return helper.sendError(
          res,
          400,
          'Board ID is required.'
        );
      }

      if (!media_source) {
        return helper.sendError(
          res,
          400,
          'Media source is required.'
        );
      }

      const payload = {
        board_id,
        media_source
      };

      if (board_section_id) {
        payload.board_section_id = board_section_id;
      }

      if (title !== undefined) {
        payload.title = title;
      }

      if (description !== undefined) {
        payload.description = description;
      }

      if (link !== undefined) {
        payload.link = link;
      }

      if (alt_text !== undefined) {
        payload.alt_text = alt_text;
      }

      const data = await pinterestController.pinterestRequest({
        method: 'POST',
        endpoint: '/pins',
        data: payload
      });

      return helper.sendSuccess(
        res,
        201,
        'Pinterest pin created successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest createPin error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to create Pinterest pin.'
      );
    }
  },


  /**
   * PATCH /pins/:pinId
   *
   * Update Pin
   *
   * NOTE:
   * Pinterest may restrict pin editing depending on
   * application access.
   */
  updatePin: async (req, res) => {
    try {

      const { pinId } = req.params;

      if (!pinId) {
        return helper.sendError(
          res,
          400,
          'Pin ID is required.'
        );
      }

      const {
        board_id,
        board_section_id,
        title,
        description,
        link,
        alt_text,
        media_source
      } = req.body;

      const payload = {};

      if (board_id !== undefined) {
        payload.board_id = board_id;
      }

      if (board_section_id !== undefined) {
        payload.board_section_id = board_section_id;
      }

      if (title !== undefined) {
        payload.title = title;
      }

      if (description !== undefined) {
        payload.description = description;
      }

      if (link !== undefined) {
        payload.link = link;
      }

      if (alt_text !== undefined) {
        payload.alt_text = alt_text;
      }

      if (media_source !== undefined) {
        payload.media_source = media_source;
      }

      if (Object.keys(payload).length === 0) {
        return helper.sendError(
          res,
          400,
          'At least one Pin field is required to update.'
        );
      }

      const data = await pinterestController.pinterestRequest({
        method: 'PATCH',
        endpoint: `/pins/${pinId}`,
        data: payload
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest pin updated successfully.',
        data
      );

    } catch (error) {

      console.error(
        'Pinterest updatePin error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to update Pinterest pin.'
      );
    }
  },


  /**
   * DELETE /pins/:pinId
   *
   * Delete Pin
   */
  deletePin: async (req, res) => {
    try {

      const { pinId } = req.params;

      if (!pinId) {
        return helper.sendError(
          res,
          400,
          'Pin ID is required.'
        );
      }

      await pinterestController.pinterestRequest({
        method: 'DELETE',
        endpoint: `/pins/${pinId}`
      });

      return helper.sendSuccess(
        res,
        200,
        'Pinterest pin deleted successfully.',
        {
          pinId
        }
      );

    } catch (error) {

      console.error(
        'Pinterest deletePin error:',
        error.response?.data || error.message
      );

      return helper.sendError(
        res,
        error.response?.status || 500,
        error.response?.data?.message ||
          error.message ||
          'Failed to delete Pinterest pin.'
      );
    }
  }

};

module.exports = pinterestController;