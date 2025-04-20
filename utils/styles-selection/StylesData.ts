/**
 * Style data definition and management
 */

export interface Style {
  id: string;
  name: string;
  description: string;
}

export class StylesData {
  private styles: Style[] = [
    {
      id: 'vangogh',
      name: 'Van Gogh',
      description:
        'Post-impressionist style with bold colors and expressive brushstrokes',
    },
    {
      id: 'monet',
      name: 'Monet',
      description: 'Impressionist style with soft, dreamlike qualities',
    },
    {
      id: 'anime',
      name: 'Anime',
      description: 'Japanese animation style with vibrant colors',
    },
    {
      id: 'pixar',
      name: 'Pixar',
      description: '3D animated style with clean, polished look',
    },
    {
      id: 'watercolor',
      name: 'Watercolor',
      description: 'Soft, flowing watercolor painting style',
    },
  ];

  /**
   * Get all available styles
   */
  getStyles(): Style[] {
    return this.styles;
  }

  /**
   * Get a style by ID
   * @param id The style ID to find
   */
  getStyleById(id: string): Style | undefined {
    return this.styles.find(style => style.id === id);
  }
}

// Export a singleton instance for use throughout the app
export const stylesData = new StylesData();